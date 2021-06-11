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
import { $WalletDocument, WalletModel, Wallet } from "../wallet/wallet.model";
import { $TransactionDocument, Transaction, TransactionModel } from "../wallet.transaction/transaction.model";
import { UserModel } from "../user/user.model";
import * as bitcoinjs from 'bitcoinjs-lib';
import { Blockchain } from "../../blockchain";
import error = require('../../error');
import conf = require('../../conf');
import log = require('../../log');
import telegramHelper = require('../../helpers/telegram');
import mailHelper = require('../../helpers/mail');
import bitcoinHelper = require('../../helpers/bitcoin');
import schemaValidator = require('../../helpers/schema-validator');

import notificationController = require('../notification/notification.controller');
import rorController = require('../ror/ror.controller');

export async function create(req: any, res: Response) {
	if (!req.user.isAnOrganization())
		return error.response(res, 'E6');

	/* TODO move to check sanity */
	if (!('admins' in req.body) || !('n' in req.body))
		return error.response(res, 'E');

	if (!('label' in req.body))
		return error.response(res, 'E3');

	if (req.body.label.length < 4)
		return error.response(res, 'E3');

	if (req.body.n < 3)
		return error.response(res, 'EW11');

	if (req.body.admins.length < req.body.n)
		return error.response(res, 'EW10');

	if (req.body.admins.length > 10)
		return error.response(res, 'EW14');

	let scripttype = 'p2sh-p2wsh';
	if ('scripttype' in req.body)
		scripttype = req.body.scripttype;

	const cw = await Wallet.countDocuments({ owner: req.username }).exec();

	if (cw >= conf.blockchain.limits.max.wallet)
		return error.response(res, 'EW6');

	for (let i = 0; i < req.body.admins.length; i++) {
		if (req.user.admins.indexOf(req.body.admins[i]) == -1)
			return error.response(res, 'E');
	}

	const w = new Wallet();
	w.owner = req.username;
	w.address = w._id;
	w.ismultisig = true;
	w.multisig.admins = [];
	w.scripttype = (scripttype as any);
	w.multisig.n = parseInt(req.body.n);
	w.label = req.body.label.substring(0, 24);

	for (let i = 0; i < req.body.admins.length; i++)
		w.multisig.admins.push(req.body.admins[i]);

	/* Create and push the server key */
	const srvpair = bitcoinHelper.randomPair();
	w.srvkey = srvpair.priv;
	w.srvpub = srvpair.pub;

	await w.save();
	res.status(200);
	res.json({ id: w._id });

	for (let i = 0; i < w.multisig.admins.length; i++) {
		await notificationController.notify({
			user: w.multisig.admins[i],
			email: true,
			code: 'feedMultisig',
			data: { wallet: w._id, label: w.label, user: req.user.username, fullname: req.user.fullname },
			redirect: '?wallet=' + w._id + '&organization=' + w.owner + '&label=' + w.label
		});
	}

	if (conf.env == 'mainnet') {
		mailHelper.send('info@helperbit.com', `[${conf.env}] New multisig wallet creation`, `Organization ${w.owner} is creating a new wallet with ${w.multisig.n} signatures. Admins are: ${JSON.stringify(w.multisig.admins)} and the wallet id is ${w._id}`);
	}
	telegramHelper.notify(`Organization ${w.owner} is creating a new wallet with ${w.multisig.n} signatures.`); // Admins are: ${w.multisig.admins} and the wallet id is ${w._id}`);
}


export async function feed(req: any, res: Response) {
	if (!('wallet' in req.body) || !('pubkey' in req.body))
		return error.response(res, 'E');

	/* Check pubkey valiity */
	if (!bitcoinHelper.checkPublicKey(req.body.pubkey))
		return error.response(res, 'E');

	const wallet: WalletModel = new WalletModel(await WalletModel.getByID(req.body.wallet, '+srvpub'));
	if (wallet === null)
		return error.response(res, 'E');

	if (wallet.d.multisig.doneadmins.indexOf(req.user.email) != -1 ||
		!wallet.d.ismultisig ||
		wallet.d.multisig.admins.indexOf(req.user.email) == -1 ||
		wallet.isActive())
		return error.response(res, 'E6');

	/* Add it */
	if (wallet.d.pubkeys.indexOf(req.body.pubkey) != -1) {
		return error.response(res, 'EW15');
	}

	wallet.d.pubkeys.push(req.body.pubkey);
	wallet.d.multisig.doneadmins.push(req.user.email);
	if (req.body.hardware) {
		wallet.d.multisig.hardwareadmins.push(req.user.email);
		wallet.d.multisig.hardwaretypes.push(req.body.hardwaretype);
	}


	/* Finalize */
	if (wallet.d.pubkeys.length == wallet.d.multisig.admins.length) {
		wallet.d.pubkeys.push(wallet.d.srvpub);

		/* Sort the pubkeys */
		wallet.d.pubkeys.sort();

		const walletScripts = bitcoinHelper.prepareScriptsOfWallet(wallet.d);

		wallet.d.address = walletScripts.address;
		wallet.d.multisig.active = true;
		wallet.d.multisig.doneadmins = [];

		notificationController.done(wallet.d.owner, 'noWallet');
	}

	try {
		await wallet.save();
	} catch (err) {
		return error.response(res, 'E');
	}

	notificationController.done(req.username, 'feedMultisig', { 'data.wallet': wallet.d._id });

	res.status(200);
	res.json({ pubkeysrv: wallet.d.srvpub });

	telegramHelper.notify(`User ${req.username} feed the signature for the wallet of ${wallet.d.owner} (hw: ${req.body.hardwaretype || 'none'})`);

	if (!wallet.isActive())
		return;

	const user = await UserModel.getByUsername(wallet.d.owner);
	if (user !== null && !schemaValidator.addressCheck(user.receiveaddress)) {
		user.receiveaddress = wallet.d.address;
		user.save();
	}

	await notificationController.notify({
		user: user,
		email: true,
		code: 'createdMultisig',
		data: { wallet: wallet.d._id, label: wallet.d.label }
	});

	if (conf.env == 'mainnet') {
		mailHelper.send('info@helperbit.com', `[${conf.env}] Multisig wallet creation completed`, `Organization ${wallet.d.owner} completed the creation of a new wallet with ${wallet.d.multisig.n} signatures. Admins are: ${JSON.stringify(wallet.d.multisig.admins)} and the wallet id is ${wallet.d._id} (script: ${wallet.d.scripttype})`);
	}
	telegramHelper.notify(`Organization ${wallet.d.owner} completed the creation of a new wallet with ${wallet.d.multisig.n} signatures.`); // Admins are: ${wallet.multisig.admins} and the wallet id is ${wallet._id} (script: ${wallet.scripttype})`);
}




export async function getPublicTransactions(req: Request, res: Response) {
	const txs = await Transaction.find({ from: req.params.name }, 'to value fee txid description time status')
		.sort({ 'time': 'desc' })
		.exec();
	res.status(200);
	res.json({ txs: txs });
}


export async function getTransactions(req: any, res: Response) {
	const txs = await Transaction.find({
		$or: [
			{
				$and: [
					{ admins: req.user.email },
					{
						refused: { $ne: req.user.email }
					}]
			},
			{ from: req.user.username }
		]
	}).exec();
	res.status(200);
	res.json({ txs: txs });
}



export async function deleteTransaction(req: any, res: Response) {
	const tx: $TransactionDocument = await Transaction.findOne({ _id: req.params.id, from: req.user.username, status: 'signing' }, 'admins _id ror').exec();
	if (tx === null) {
		res.status(200);
		return res.json({});
	}

	/* Transform the ror in pending */
	if (tx.ror != null) {
		await rorController.removeAcceptance(tx.ror);
	}

	/* Delete notifications */
	notificationController.done(tx.admins, 'signMultisig', { 'data.id': tx._id });

	/* Remove */
	await tx.remove();

	res.status(200);
	res.json({});

	telegramHelper.notify(`Organization ${req.user.username} removed a pending multisig tx`);
}


export async function refuseTransaction(req: any, res: Response) {
	const tx: $TransactionDocument = await TransactionModel.getByID(req.params.id);

	if (tx === null)
		return error.response(res, 'E');

	if (tx.signers.indexOf(req.user.email) != -1 || tx.admins.indexOf(req.user.email) == -1 ||
		tx.refused.indexOf(req.user.email) != -1) {
		return error.response(res, 'E');
	}

	tx.refused.push(req.user.email);

	/* TODO report to the admin as notification */
	if (tx.refused.length > (tx.admins.length - tx.n + 1)) {
		await Transaction.remove({ _id: req.params.id });

		/* Transform the ror in pending */
		if (tx.ror != null) {
			rorController.removeAcceptance(tx.ror);
		}
	}
	else {
		await tx.save();
	}

	res.status(200);
	res.json({});
	telegramHelper.notify(`User refused to sign ${req.params.id} multisig transaction`); // ${req.user.email}
	notificationController.done(req.username, 'signMultisig', { 'data.id': tx._id });
}



export async function signTransaction(req: any, res: Response) {
	if (!('txhex' in req.body))
		return error.response(res, 'E');

	const tx: $TransactionDocument = await TransactionModel.getByID(req.params.id);

	if (tx === null)
		return error.response(res, 'E');

	/* Already broadcasted */
	if (tx.status != 'signing') {
		res.status(200);
		res.json({ broadcast: true, txid: tx.txid });
		return;
	}

	/* Check if the new hex has less or equal of the already present hex */
	const txb2 = bitcoinjs.Psbt.fromHex(req.body.txhex, { network: conf.blockchain.network });
	if (!txb2.validateSignaturesOfAllInputs()) {
		log.critical('Wallet', `Sign to ${tx.txid} failed because of wrong tx / wrong signatures`, req);
		error.response(res, 'E');
		telegramHelper.notify(`Sign to ${tx.txid} failed because of wrong tx / wrong signatures.`);
		return;
	}

	tx.hex = req.body.txhex;

	if (tx.signers.indexOf(req.user.email) != -1 || tx.admins.indexOf(req.user.email) == -1)
		return error.response(res, 'E');

	tx.signers.push(req.user.email);

	/* We have reached the number of needed signatures, then broadcast */
	if (tx.signers.length == tx.n) {
		/* No sense lines which fix the key ordering problem */
		txb2.finalizeAllInputs();
		const txf = txb2.extractTransaction();
		tx.hex = txf.toHex();
		tx.txid = txf.getId();
		tx.status = 'signed';

		await tx.save();
		res.status(200);
		res.json({ txid: tx.txid, broadcast: true });

		notificationController.done(req.username, 'signMultisig', { 'data.id': tx._id });
		telegramHelper.notify(`User signed ${req.params.id} multisig transaction.`); // ${req.user.email}
		telegramHelper.notify(`Tx sent: ${tx.txid}`);

		/* Transform the ror in sent */
		if (tx.ror != null) {
			rorController.sent(tx.ror, tx.txid);
			await notificationController.notify({
				user: tx.from,
				code: 'multisigRORBroadcast',
				data: { tx: tx._id },
				redirect: '' + tx.txid
			});
		} else {
			await notificationController.notify({
				user: tx.from,
				code: 'multisigBroadcast',
				data: { tx: tx._id },
				redirect: '' + tx.txid
			});
		}

		try {
			const txid = await Blockchain.pushTransactionAll(tx.hex);
			tx.status = 'broadcasted';
			tx.save(err => { });

			await Blockchain.invalidateAddressCache(tx.wallet.address);
		} catch (err) {
			log.critical('Wallet', `Broadcast failed for tx with hex: ${tx.hex}`, req);
			return error.response(res, 'E');
		}
	} else if (tx.signers.length > tx.n) {
		return error.response(res, 'E');
	} else {
		await tx.save();
		res.status(200);
		res.json({ broadcast: false, remaining: tx.n - tx.signers.length });

		notificationController.done(req.username, 'signMultisig', { 'data.id': tx._id });
		telegramHelper.notify(`User signed ${req.params.id} multisig transaction`); // ${req.user.email} 
	}
}
