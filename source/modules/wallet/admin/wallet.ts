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
import { WalletModel, Wallet } from "../../wallet/wallet.model";

const router = require('express').Router();
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
import { Blockchain } from "../../../blockchain";
import { Transaction } from "../../wallet.transaction/transaction.model";
import { TimeLockTransaction } from "../../wallet.verify/timelocktransaction.model";
import { estimateTransactionSizeSync, getByteCount, utxoSelector } from "../../../helpers/bitcoin";
import {checkLogin } from '../../admin/auth';
// const hbCache = new RedisCache();


router.get('/wallets/list/:type', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const q: any = {};

	switch (req.params.type) {
		case 'multi':
			q.ismultisig = true;
			q['multisig.active'] = true;
			break;
		case 'multi_inactive':
			q.ismultisig = true;
			q['multisig.active'] = false;
			break;
		case 'single':
			q.ismultisig = false;
			break;
		case 'all':
			break;
	}

	const query = Wallet.find(q, 'owner address creationdate multisig ismultisig scripttype label lasttimelocktransaction').sort({ regdate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('wallet/admin/list', { page: 'wallet', wallets: data.results, pagination: data.pagination, title: 'List: ' + req.params.type });
});


router.get('/wallet/:id', checkLogin, async (req: Request, res: Response) => {
	const id: any = req.params.id;
	const wallet = await WalletModel.getByID(id);
	if (wallet === null)
		return res.redirect('/admin/wallets');

	res.render('wallet/admin/wallet/wallet', {
		page: 'wallet',
		balance: await Blockchain.getBalance(wallet.address),
		transactions: wallet.ismultisig && wallet.multisig.active ?
			await Transaction.find({from: wallet.address}).sort({time: 'desc'}).exec()
			: [],
		tltxs: await TimeLockTransaction.find({'wallet.id': wallet._id}).sort({time: 'desc'}).exec(),
		utxos: await Blockchain.getUnspent(wallet.address),
		utxoSelector: utxoSelector,
		estimateTransactionSizeSync: estimateTransactionSizeSync,
		getByteCount: getByteCount,
		fees: await Blockchain.getFees(),
		wallet: wallet
	});
});

// router.get('/user/:name/trustupdate', checkAuth('admin'), async (req: Request, res: Response) => {
// 	const name = req.params.name;
// 	const user = await UserModel.getByUsername(name);
// 	user.updateTrust();
// 	await user.save();
// 	res.status(200);
// 	res.json({});
// });



export const WalletAdminApi = router;
