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

import { Response } from "express";
import { WalletModel, Wallet, $WalletDocument } from "../wallet/wallet.model";
import { TimeLockTransaction, $TimeLockTransactionDocument } from "./timelocktransaction.model";
import { Psbt, ECPair } from "bitcoinjs-lib";
import { Blockchain } from "../../blockchain";
import conf = require('../../conf');
import bitcoinHelper = require('../../helpers/bitcoin');
import moment = require('moment');
import * as error from '../../error';
import { prepareInput } from "../../helpers/bitcoin";
import log = require('../../log');
import telegramHelper = require('../../helpers/telegram');
import { WalletVerifyConfig, WalletKeyverModule } from ".";
import * as notificationController from "../notification/notification.controller";
import { getModuleConfiguration } from "../module";

export async function createTimeLockPsbtTransaction(opts: {
	utxos: Blockchain.UTXO[];
	wallet: $WalletDocument;
	address: string;
	locktime: number;
	checkBalance?: boolean;
}): Promise<Psbt> {
	const txb: Psbt = new Psbt({ network: conf.blockchain.network });
	let cumvalue = 0.0;

	for (let i = 0; i < opts.utxos.length; i++) {
		txb.addInput({ ...await prepareInput(opts.utxos[i], opts.wallet), ...{ sequence: 0xfffffffe } });
		cumvalue += Number(opts.utxos[i].value);
	}

	if (cumvalue > 0) {
		const txlen: number = await bitcoinHelper.estimateTransactionSize({
			wallet: opts.wallet,
			value: null,
			fee: 0.00000500,
			address: opts.address
		});
		const fees = await Blockchain.getFees();

		txb.addOutput({
			address: opts.address,
			value: bitcoinHelper.Conversion.toSatoshi(cumvalue) - Math.floor(txlen * fees.fastestFee)
		});
	}

	txb.setLocktime(opts.locktime);

	if (opts.checkBalance) {
		const balance = await Blockchain.getBalance(opts.wallet.address);
		if (cumvalue != balance.balance)
			return Promise.reject({ reason: 'inconsistent balance', balance: balance.balance, utxbalance: cumvalue });
	}

	return txb;
}

export async function createTimeLockTransaction(wallet: $WalletDocument): Promise<$TimeLockTransactionDocument> {
	const verifyConf: WalletVerifyConfig = getModuleConfiguration(WalletKeyverModule);
	
	const tltx = new TimeLockTransaction();
	tltx.txid = tltx._id;
	tltx.wallet = {
		id: wallet._id,
		address: wallet.address,
		ismultisig: wallet.ismultisig,
		label: wallet.label,
		hardware: wallet.hardware
	};

	// tltx.description = req.body.description;
	// tltx.hex = txb.toHex();
	tltx.from = wallet.owner;
	// tltx.value = value;
	// tltx.fee = fee;
	tltx.pubkeys = wallet.pubkeys;
	tltx.to = verifyConf.recoveryAddress;
	tltx.toalternative = verifyConf.alternativeRecoveryAddress;
	tltx.n = wallet.multisig.n;
	// tltx.value_historic.usd = usd_price;
	// tltx.value_historic.eur = eur_price;
	tltx.scripttype = wallet.scripttype;

	if (wallet.ismultisig) {
		// tltx.status = 'creation';
		// tltx.utxos = utxos;
		// tltx.hex = '';
		tltx.hardwareadmins = wallet.multisig.hardwareadmins;
		tltx.hardwaretypes = wallet.multisig.hardwaretypes;
		tltx.signers = [];
		tltx.admins = wallet.multisig.admins;
	}

	// else {
	tltx.status = 'signing';
	const utxos = await Blockchain.getUnspent(wallet.address);

	/* Create the recovery transaction */
	const txb: Psbt = await createTimeLockPsbtTransaction({
		utxos: utxos,
		address: verifyConf.recoveryAddress,
		wallet: wallet,
		locktime: moment().add(verifyConf.recoveryTimeout[0], verifyConf.recoveryTimeout[1]).unix(),
		checkBalance: true
	});
	tltx.hex = txb.toHex();

	/* Create the recovery of transaction */
	const txb2: Psbt = await createTimeLockPsbtTransaction({
		utxos: utxos,
		address: verifyConf.alternativeRecoveryAddress,
		wallet: wallet,
		locktime: moment().add(verifyConf.alternativeRecoveryTimeout[0], verifyConf.alternativeRecoveryTimeout[1]).unix()
	});
	tltx.recoveryhex = txb2.toHex();

	tltx.locktime = moment().add(verifyConf.recoveryTimeout[0], verifyConf.recoveryTimeout[1]).unix();

	if (utxos.length == 0)
		tltx.onlycheck = true;

	tltx.utxos = utxos;

	tltx.value = utxos.reduce((prev, curr) => curr.value + prev, 0);

	// tltx.txid = htx._id;
	// }	
	// }

	return tltx;
}


export async function getList(req: any, res: Response) {
	const wallets: ($WalletDocument & {
		lastverify?: any;
		history?: any[];
	})[] = (await WalletModel.listByOwner(req.username, '_id address label multisig ismultisig creationdate'));

	for (let i = 0; i < wallets.length; i++) {
		if (wallets[i].ismultisig && !wallets[i].multisig.active)
			continue;
			
		const tltxs = await TimeLockTransaction.find({ 'wallet.id': wallets[i]._id }).sort({ time: 'desc' }).exec();
		const signed = tltxs.filter(h => h.status == 'signed');

		if (signed.length > 0)
			wallets[i].lastverify = signed[0].time;
		else
			wallets[i].lastverify = wallets[i].creationdate;

		wallets[i].history = tltxs.map(h => {
			const v: any = {
				status: h.status,
				time: h.time,
				value: h.value,
				locktime: h.locktime
			};
			if (wallets[i].ismultisig) {
				v.signers = h.signers.length;
				v.admins = h.admins.length;
			}
			return v;
		});
	}

	const verifications = wallets.map(w => {
		return {
			history: w.history,
			ismultisig: w.ismultisig,
			address: w.address,
			label: w.label,
			lastverify: w.lastverify,
			scripttype: w.scripttype,
			hardware: w.hardware
		}
	})

	res.status(200);
	res.json({ verifications: verifications });
}



export async function getPendings(req: any, res: Response) {
	const txs = await TimeLockTransaction.find({
		$and: [
			{
				$or: [
					{ 'from': req.user.username },
					{ 'admins': req.user.email }
				]
			},
			{
				$or: [
					{ status: 'signing' },
					{ status: 'creation' }
				]
			}
		]
	}, 'status time value locktime wallet').exec();

	res.status(200);
	res.json({ pending: txs });
}


export async function getTLTransaction(req: any, res: Response) {
	const tx = await TimeLockTransaction.findOne({
		_id: req.params.id,
		$or: [
			{ 'from': req.user.username },
			{ 'admins': req.user.email }
		]
	});

	if (!tx)
		return error.response(res, 'E');

	res.status(200);
	res.json(tx);
}


export async function submitSignature(req: any, res: Response) {
	if (!('txhex' in req.body) || !('recoveryhex' in req.body))
		return error.response(res, 'E');

	const tx = await TimeLockTransaction.findOne({ from: req.username, 'wallet.address': req.params.address, 'status': 'signing' }).exec();
	const wallet = await Wallet.findOne({ address: req.params.address }, '+srvkey').exec();

	if (!tx)
		return error.response(res, 'E');

	if (tx.onlycheck) {
		tx.status = 'signed';
		tx.txid = tx._id;

		await tx.save();

		log.debug('Wallet', `User ${req.user.username} verified the key of wallet ${tx.wallet.address}`, req);
		telegramHelper.notify(`User ${req.user.username} verified the key of wallet ${tx.wallet.address}`);

		res.status(200);
		return res.json({});
	}

	/* Aggiungere la firma di hb */
	const txb = Psbt.fromHex(req.body.txhex, { network: conf.blockchain.network });
	txb.signAllInputs(ECPair.fromWIF(wallet.srvkey, conf.blockchain.network));
	const txb2 = Psbt.fromHex(req.body.recoveryhex, { network: conf.blockchain.network });
	txb2.signAllInputs(ECPair.fromWIF(wallet.srvkey, conf.blockchain.network));

	if (!txb.validateSignaturesOfAllInputs() || !txb2.validateSignaturesOfAllInputs()) {
		log.critical('Wallet', `Sign of recovery transaction ${tx.txid} failed because of wrong tx / wrong signatures`, req);
		telegramHelper.notify(`Sign of recovery transaction ${tx.txid} failed because of wrong tx / wrong signatures.`);
		return error.response(res, 'E');
	}

	txb.finalizeAllInputs();
	const txf = txb.extractTransaction();
	tx.hex = txf.toHex();
	tx.txid = txf.getId();
	tx.status = 'signed';

	// Recovery transaction
	txb2.finalizeAllInputs();
	tx.recoveryhex = txb2.extractTransaction().toHex();


	await tx.save();

	log.debug('Wallet', `User ${req.user.username} signed a recovery transaction ${tx.txid}`, req);
	telegramHelper.notify(`User ${req.user.username} signed a recovery transaction ${tx.txid}`);

	res.status(200);
	res.json({});
}



export async function feedSignature(req: any, res: Response) {
	if (!('txhex' in req.body) || !('recoveryhex' in req.body))
		return error.response(res, 'E');

	const tx = await TimeLockTransaction.findOne({ 'wallet.address': req.params.address, 'status': 'signing' }).exec();

	if (!tx || tx.signers.indexOf(req.user.email) != -1 || tx.admins.indexOf(req.user.email) == -1)
		return error.response(res, 'E');

	/* Check if the new hex has less or equal of the already present hex */
	if (tx.onlycheck) {
		tx.signers.push(req.user.email);

		/* We have reached the number of needed signatures */
		if (tx.signers.length == tx.n) {
			tx.txid = tx._id;
			tx.status = 'signed';

			notificationController.done(req.username, 'signVerifyMultisig', { 'data.id': req.params.id });
			telegramHelper.notify(`User signed ${tx.txid} multisig recovery transaction.`);
			telegramHelper.notify(`Recovery transaction ${tx.txid} sucessfully created.`);
		} else if (tx.signers.length > tx.n) {
			return error.response(res, 'E');
		} else {
			notificationController.done(req.username, 'signVerifyMultisig', { 'data.id': req.params.id });
			telegramHelper.notify(`User signed ${tx.txid} multisig recovery transaction`);
		}

		await tx.save();
		res.status(200);
		return res.json({});
	}

	const txb = Psbt.fromHex(req.body.txhex, { network: conf.blockchain.network });
	const txb2 = Psbt.fromHex(req.body.recoveryhex, { network: conf.blockchain.network });

	if (!txb.validateSignaturesOfAllInputs() || !txb2.validateSignaturesOfAllInputs()) {
		log.critical('Wallet', `Sign to ${tx.txid} failed because of wrong tx / wrong signatures`, req);
		telegramHelper.notify(`Sign to ${tx.txid} failed because of wrong tx / wrong signatures.`);
		return error.response(res, 'E');
	}

	tx.hex = req.body.txhex;
	tx.signers.push(req.user.email);
	tx.recoveryhex = req.body.recoveryhex;

	/* We have reached the number of needed signatures */
	if (tx.signers.length == tx.n) {
		txb.finalizeAllInputs();
		const txf = txb.extractTransaction();
		tx.hex = txf.toHex();
		tx.txid = txf.getId();
		tx.status = 'signed';

		txb2.finalizeAllInputs();
		tx.recoveryhex = txb2.extractTransaction().toHex();

		notificationController.done(req.username, 'signVerifyMultisig', { 'data.id': req.params.id });
		telegramHelper.notify(`User signed ${tx.txid} multisig recovery transaction.`);
		telegramHelper.notify(`Recovery transaction ${tx.txid} sucessfully created.`);
	} else if (tx.signers.length > tx.n) {
		return error.response(res, 'E');
	} else {
		notificationController.done(req.username, 'signVerifyMultisig', { 'data.id': req.params.id });
		telegramHelper.notify(`User signed ${tx.txid} multisig recovery transaction`);
	}

	await tx.save();
	res.status(200);
	res.json({});
}


export async function startVerification(req: any, res: Response) {
	const tx = await TimeLockTransaction.findOne({
		'wallet.address': req.params.address,
		$or: [
			{ 'status': 'creation' },
			{ 'status': 'signing' }
		]
	}).exec();

	if (tx)
		return error.response(res, 'EWV1');

	const wallet = await Wallet.findOne({ 
		$or: [
			{ ismultisig: false },
			{ $and: [{ ismultisig: true }, { 'multisig.active': true }] }
		],
		address: req.params.address }).exec();

	// TODO: check if we need to pay!
	const needFee = (req.user.usertype == 'npo' && !req.user.premium);
	log.debug('Wallet', `Have to pay? ${needFee}`);

	const tltx = await createTimeLockTransaction(wallet);
	await tltx.save();

	log.debug('Wallet', `User ${req.user.username} started a wallet verification for ${tltx.wallet.address}`, req);
	telegramHelper.notify(`User ${req.user.username} started a wallet verification for ${tltx.wallet.address}`);

	/* Send notification to admins */
	for (let i = 0; i < tltx.admins.length; i++) {
		await notificationController.notify({
			user: tltx.admins[i],
			email: true,
			code: 'signVerifyMultisig',
			data: {
				user: wallet.owner,
				wallet: wallet.address,
				label: wallet.label
			},
			redirect: ''
		});
	}

	// console.log(JSON.stringify(tltx));
	res.status(200);
	res.json(tltx);
}


export async function removeVerification(req: any, res: Response) {
	const tx = await TimeLockTransaction.findOne({ from: req.username, 'wallet.address': req.params.address, 'status': 'signing' }).exec();

	if (tx.wallet.ismultisig) {
		for(const admin of tx.admins) {
			notificationController.done(admin, 'signVerifyMultisig', { 'data.id': tx._id });	
		}
	}

	await tx.remove();
	res.status(200);
	res.json({});
}
