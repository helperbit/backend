/* 
 *  Helperbit: a p2p donation platform (backend)
 *  Copyright (C) 2016-2021  Davide Gessa (gessadavide@gmail.com)
 *  Copyright (C) 2016-2021  Helperbit team
 *  
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>
 */

import { Request, Response } from "express";
import { WalletModel } from "../../wallet/wallet.model";
import { Transaction, TransactionModel } from "../transaction.model";
import * as bitcoinjs from 'bitcoinjs-lib';
import AdminLogController = require('../../admin.log/log.controller');
import notificationController = require('../../notification/notification.controller');
import { Blockchain } from "../../../blockchain";
import {checkLogin, checkAuth } from '../../admin/auth';
import conf = require('../../../conf');
import log = require('../../../log');
import error = require('../../../error');
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";

const router = require('express').Router();

router.get('/transactions/multisig/:status', checkLogin, (req: AdminPaginateRequest, res: Response) => {
	const st = req.params.status;
	let q = {};

	switch (st) {
		case 'all':
			q = {};
			break;
		case 'broadcasted':
			q = { status: 'broadcasted' };
			break;
		case 'confirmed':
			q = { status: 'confirmed' };
			break;
		case 'tosign':
			q = { status: 'signing' };
			break;
	}

	const query = Transaction.find(q).sort({ time: 'desc' })
	adminQueryPaginate(query, req.query).then(data => {
		res.render('wallet.transaction/admin/list', { page: 'transaction', txs: data.results, pagination: data.pagination, title: st });
	});
});

router.get('/transaction/:id', checkLogin, async (req: Request, res: Response) => {
	const data = await TransactionModel.getByID(req.params.id);
	res.render('wallet.transaction/admin/detail', { page: 'transaction', tx: data });
});

router.get('/transaction/:id/hide', checkAuth('admin'), async (req: Request, res: Response) => {
	const d = await TransactionModel.getByID(req.params.id);
	d.status = 'hidden';
	await d.save();
	AdminLogController.operation(req, 'Transaction', `Transaction ${req.params.id} marked as hidden`);
	res.redirect('/admin/transaction/' + req.params.id);
});

router.get('/transaction/:id/show', checkAuth('admin'), async (req: Request, res: Response) => {
	const d = await TransactionModel.getByID(req.params.id);
	d.status = 'confirmed';
	await d.save();
	AdminLogController.operation(req, 'Transaction', `Transaction ${req.params.id} marked as visible`);
	res.redirect('/admin/transaction/' + req.params.id);
});

router.post('/transaction/:id/sign', checkAuth('admin'), async (req: Request, res: Response) => {
	const tx = await TransactionModel.getByID(req.params.id);
	if (tx === null)
		return error.response(res, 'E');

	if (tx.status == 'broadcasted' === true)
		return error.rawresponse(res, 'already broadcasted');

	if (tx.signers.length < tx.n - 1)
		return error.rawresponse(res, `at least ${tx.n} signatures should be present`);

	const w = await WalletModel.getByID(tx.wallet.id, '+srvkey scripttype pubkeys multisig');
	const txb2 = bitcoinjs.Psbt.fromHex(tx.hex, { network: conf.blockchain.network });

	txb2.signAllInputs(bitcoinjs.ECPair.fromWIF(w.srvkey, conf.blockchain.network));
	txb2.finalizeAllInputs();
	const txf = txb2.extractTransaction();
	const txhex = txf.toHex();
	tx.txid = txf.getId();
	tx.status = 'signed';
	await tx.save();
	res.status(200);
	res.json({ txid: tx.txid, broadcast: true });

	await notificationController.notify({
		user: tx.from,
		code: 'multisigBroadcast',
		data: { tx: tx._id },
		redirect: '' + tx.txid
	});

	try {
		const txid = await Blockchain.pushTransaction(txhex);
		tx.status = 'broadcasted';
		await tx.save();
		AdminLogController.operation(req, 'Transaction', `Transaction ${tx.txid} manually signed`);
	} catch (err) {
		log.critical('Wallet', `Broadcast failed for transaction with hex: ${txhex}`);
		return error.rawresponse(res, 'not broadcasted');
	}
});


export const TransactionAdminApi = router;
