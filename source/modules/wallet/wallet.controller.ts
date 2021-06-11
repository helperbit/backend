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

import * as bitcoinjs from 'bitcoinjs-lib';
import { Blockchain } from "../../blockchain";
import error = require('../../error');
import conf = require('../../conf');
import log = require('../../log');
import telegramHelper = require('../../helpers/telegram');
import bitcoinHelper = require('../../helpers/bitcoin');
import schemaValidator = require('../../helpers/schema-validator');

import donationController = require('../donation/donation.controller');
import notificationController = require('../notification/notification.controller');
import rorController = require('../ror/ror.controller');
import projectController = require('../project/project.controller');
import transactionController = require('../wallet.transaction/transaction.controller');

import { $WalletDocument, WalletModel, Wallet } from './wallet.model';
import { NextFunction, Request, Response } from 'express';
import { Transaction } from '../wallet.transaction/transaction.model';
import { UserModel } from '../user/user.model';
import { RedisCache } from '../../helpers/cache';

const hbCache = new RedisCache();


/* Middleware: get the wallet :address dell'utente autenticato */
export async function get(req: any, res: Response, next: NextFunction) {
	const address = req.params.address;

	let wallet: $WalletDocument = await WalletModel.getByOwnerAndAddress(req.username, address, '+srvkey');
	if (wallet === null)
		wallet = await Wallet.findOne({ _id: address, owner: req.username, 'multisig.active': true }, '').exec();
	if (wallet === null)
		return error.response(res, 'E');

	req.wallet = wallet;
	next();
}



export async function getAddresses(req: Request, res: Response) {
	try {
		const addresses = await Wallet.find({ $or: [{ ismultisig: false }, { $and: [{ ismultisig: true, 'multisig.active': true }] }] }, 'address').exec();
		res.status(200);
		res.json({ 'addresses': addresses.map(a => a.address) });
	} catch (err) {
		error.response(res, 'E');
	}
}




export async function getBalance(req: Request, res: Response) {
	try {
		const balance = await Blockchain.getBalance(req.params.address);
		res.status(200);
		res.json({
			'balance': Number(balance.balance),
			'received': Number(balance.received),
			'unconfirmed': Number(balance.unconfirmed)
		});
	} catch (err) {
		error.response(res, 'E');
	}
}


export async function getUserAddresses(req: Request, res: Response) {
	const addressList: $WalletDocument[] = await WalletModel.listByOwner(req.params.name, 'address multisig ismultisig');
	if (addressList === null)
		error.response(res, 'E');

	const address = [];
	addressList.forEach(addr => {
		if ((addr.ismultisig && addr.multisig.active) || !addr.ismultisig)
			address.push(addr.address);
	});

	res.status(200);
	res.json({ addresses: address });
}



export async function getFaucet(req: any, res: Response) {
	try {
		const balance = await Blockchain.getBalance(req.wallet.address);

		if (Number(balance.balance) >= 0.01)
			return error.response(res, 'EF2');
	} catch (err) {
		error.response(res, 'EF3');
	}

	hbCache.expire('unspent_' + conf.blockchain.faucet.address, 1);
	// TODO: fix
	// let txb = null;
	// try {
	// 	const res = await bitcoinHelper.prepareTransaction({
	// 		wallet: { address: conf.blockchain.faucet.address, ismultisig: false, scripttype: 'p2sh' },
	// 		value: conf.blockchain.faucet.value,
	// 		fee: conf.blockchain.limits.min.fee,
	// 		address: req.wallet.address,
	// 		wif: conf.blockchain.faucet.privkey
	// 	});
	// 	txb = res.psbt;
	// } catch (err) {
	// 	return error.response(res, 'E');
	// }

	// /* Return hex */
	// const tx = txb.finalizeAllInputs().extractTransaction();
	// const txhex = tx.toHex();
	// const txid = tx.getId();

	// try {
	// 	const txid = await Blockchain.pushTransactionAll(txhex);
	// 	res.status(200);
	// 	res.json({ txid: txid });
	// 	await Blockchain.invalidateAddressCache(req.wallet.address);
	// } catch (err) {
	// 	log.error('Faucet', `Failed to send ${txid}: ${txhex}`);
	// 	error.response(res, 'EW5');
	// }
}



export async function getList(req: any, res: Response) {
	const wallets = await WalletModel.listByOwner(req.username);
	const user = await UserModel.getByUsername(req.username);
	const adminof = await Wallet.find({ ismultisig: true, "multisig.admins": user.email }).exec();
	res.status(200);
	res.json({ 'wallets': wallets, 'adminof': adminof, 'receiveaddress': req.user.receiveaddress });
}




export async function create(req: any, res: Response) {
	/* Get public keys of user */
	/* TODO move to checksanity */
	if (!('pubkeys' in req.body) || req.body.pubkeys.length != 2)
		return error.response(res, 'E');

	/* Check pubkey validity */
	if (!bitcoinHelper.checkPublicKey(req.body.pubkeys[0]) || !bitcoinHelper.checkPublicKey(req.body.pubkeys[1]))
		return error.response(res, 'E');

	/* Check for maxaddress */
	const cw = await Wallet.countDocuments({ owner: req.username }).exec();
	if (cw >= conf.blockchain.limits.max.wallet)
		return error.response(res, 'EW6');

	/* Get the scripttype or use default */
	let scripttype = 'p2sh-p2wsh';
	if ('scripttype' in req.body)
		scripttype = req.body.scripttype;

	/* Generate server priv/pub */

	const srvpair = bitcoinHelper.randomPair();
	const pubkeys = [req.body.pubkeys[0], req.body.pubkeys[1], srvpair.pub];
	const walletScripts = bitcoinHelper.prepareScripts(scripttype, 2, pubkeys);

	const w = new Wallet();
	w.owner = req.username;
	w.address = walletScripts.address;
	w.pubkeys = pubkeys;
	w.srvkey = srvpair.priv;
	w.srvpub = srvpair.pub;
	w.scripttype = (scripttype as any);
	if (req.body.hardware)
		w.hardware = req.body.hardwaretype || 'none';
	w.label = 'Default-' + (cw + 1);

	try {
		await w.save();

		/* Update receiveaddress */
		const user = await UserModel.getByUsername(req.username);
		if (user !== null && !schemaValidator.addressCheck(user.receiveaddress)) {
			user.receiveaddress = w.address;
			await user.save();
		}
		notificationController.done(req.username, 'noWallet');

		res.status(200);
		res.json({ address: w.address, pubkeysrv: w.srvpub });

		telegramHelper.notify(`User: ${req.username} created a new wallet (script: ${w.scripttype}, hw: ${w.hardware})`); // ${address}
	} catch (err) {
		return error.response(res, 'E');
	}
}


export async function remove(req: any, res: Response) {
	const wallet = new WalletModel(req.wallet);
	const balance = wallet.isActive() ? await wallet.getBalance() : { balance: 0.0 };

	if (balance.balance !== 0.0)
		return error.response(res, 'EF2');

	/* Remove feed notifications for pending multisig */
	if (wallet.isMultisig() && !wallet.isActive()) {
		notificationController.done(wallet.d.multisig.admins, 'feedMultisig', { 'data.wallet': wallet._id });
	}
	/* Completed multisig cannot be deleted */
	else if (wallet.isMultisig() && wallet.isActive()) {
		return error.response(res, 'EW12');
	}

	try {
		await wallet.remove();
	} catch (err) {
		return error.response(res, 'E');
	}

	/* Update receiveaddress */
	const user = await UserModel.getByUsername(req.username);

	if (user === null) {
		return error.response(res, 'E');
	}

	if (user.receiveaddress != wallet.address) {
		res.status(200);
		return res.json({});
	}


	const ws: $WalletDocument[] = await WalletModel.listByOwner(req.username);
	if (ws !== null && ws.length > 0) {
		user.receiveaddress = ws[0].address;
		await user.save();
	} else if (ws !== null && ws.length === 0) {
		user.receiveaddress = '';
		await user.save();
	}

	res.status(200);
	res.json({});
}



export async function update(req: any, res: Response) {
	const receiveWallet = async () => {
		const user = await UserModel.getByUsername(req.username);
		if (user === null)
			return error.response(res, 'E');

		if (req.wallet.ismultisig && req.wallet.multisig.active === false)
			return error.response(res, 'E');

		user.receiveaddress = req.wallet.address;
		user.save();

		res.status(200);
		res.json({});
	};

	const updateWallet = async (label) => {
		if (label.length < 4)
			return error.response(res, 'E3');

		label = label.substr(0, 35);

		/* Check if another wallet has the same name */
		const w = await Wallet.find({ owner: req.username, label: label }).exec();
		if (w.length > 0)
			return error.response(res, 'E3');

		req.wallet.label = label;
		await req.wallet.save();
		res.status(200);
		res.json({});
	};

	if ('receive' in req.body)
		return await receiveWallet();
	else if ('label' in req.body)
		return await updateWallet(req.body.label);
	else
		return error.response(res, 'E');
}


/* Send a raw signed transaction */
export async function send(req: any, res: Response) {
	/* TODO move to checksanity */
	if (!('txhex' in req.body))
		return error.response(res, 'E3');

	let donation = null;

	if ('donation' in req.body)
		donation = req.body.donation;

	/* Parse the transaction to get the signer, destinations and values */
	const txb = bitcoinjs.Psbt.fromHex(req.body.txhex, { network: conf.blockchain.network });
	txb.finalizeAllInputs();
	const tx = txb.extractTransaction();
	const txid = tx.getId();
	const txhex = tx.toHex();

	const done = async (txid) => {
		/* Update the donation row */
		if (donation !== null) {
			return donationController.broadcast(res, donation, txid);
		} else {
			res.status(200);
			res.json({ txid: txid });

			telegramHelper.notify(`User: ${req.username} broadcasted transaction ${txid}`);
			/* If this transaction is an outgoing tx from a project company, update project balances */
			// TODO: sensato, ma non funziona
			// const value = await hbCache.get('withdraw_' + tx.ins[0].hash);
			// if (value) {
			// 	const v = JSON.parse(value);
			// 	projectController.updateProjectBalances(v.address, v.from, v.value);
			// }
		}
	}

	try {
		const txid_broad = await Blockchain.pushTransaction(txhex);
		await done(txid);
		await Blockchain.pushTransactionAll(txhex).then(txid => { }).catch(err => { });
	} catch (err) {
		try {
			const tx = await Blockchain.getTransaction(txid);
			await done(txid);
		} catch (err) {
			log.error('Wallet', `Failed to send tx ${txid}: ${txhex}`);
			error.response(res, 'E');

			telegramHelper.notify(`User: ${req.username} failed to broadcast tx: ${txid}\nHex: ${txhex}`);
		}
	}
}


/* Calculate withdraw fee */
export async function withdrawFees(req: any, res: Response) {
	let dest = null;

	if ('destination' in req.body)
		dest = { address: req.body.destination };
	else if ('distribution' in req.body) {
		dest = { addresses: [] };

		for (const d in req.body.distribution) {
			try {
				dest.addresses.push({ address: req.wallet.address, value: Math.floor(req.body.distribution[d]) });
			} catch (err) {
				return error.response(res, 'EW2');
			}
		};
	} else
		return error.response(res, 'E3');

	let len: number = null;
	try {
		len = await bitcoinHelper.estimateTransactionSize({
			wallet: req.wallet,
			value: parseFloat(req.body.value),
			lockedUTXOs: await transactionController.lockedUTXOs(req.wallet.address, req.wallet.ismultisig),
			fee: null,
			...dest
		});
	} catch (err) {
		return error.response(res, err);
	}

	const fees = await Blockchain.getFees();

	res.status(200);
	res.json({
		fees: Math.floor(len * fees.fastestFee),
		fastest: Math.floor(len * fees.fastestFee),
		halfhour: Math.floor(len * fees.halfHourFee),
		hour: Math.floor(len * fees.hourFee),
		slowest: Math.floor(len * fees.slowestFee)
	});
}


/* Withdraw */
export async function withdraw(req: any, res: Response) {
	const destination = req.body.destination;
	const value = bitcoinHelper.Conversion.floorToSatoshi(parseFloat(req.body.value));
	const fee = parseFloat(req.body.fee);
	let txb: bitcoinjs.Psbt = null;
	let utxos: Blockchain.UTXO[] = [];

	try {
		const res = await bitcoinHelper.prepareTransaction({
			wallet: req.wallet,
			address: destination,
			value: value,
			fee: fee,
			lockedUTXOs: await transactionController.lockedUTXOs(req.wallet.address, req.wallet.ismultisig)
		});
		txb = res.psbt;
		utxos = res.utxos;
	} catch (err) {
		return error.response(res, err);
	}

	/* Normal transaction */
	if (!req.wallet.ismultisig) {
		/* Sign with server key */
		txb.signAllInputs(bitcoinjs.ECPair.fromWIF(req.wallet.srvkey, conf.blockchain.network));

		/* Return hex */
		const txhex = txb.toHex();

		res.status(200);
		res.json({ txhex: txhex, utxos: utxos });

		telegramHelper.notify(`User: ${req.wallet.owner} is creating a withdraw of ${value} to ${destination} (script: ${req.wallet.scripttype})`);
		await Blockchain.invalidateAddressCache(req.wallet.address);

		/* Cache the withdraw, for company project */ 
		// TODO: non funziona
		// await hbCache.set('withdraw_' + txb.extractTransaction().ins[0].hash, JSON.stringify({
		// 	address: req.wallet.address,
		// 	from: req.wallet.owner,
		// 	value: value
		// }), 300);
	}
	/* Multisig transaction */
	else {
		/* Sign with server key */
		// TODO: this avoid the automatic helperbit signature
		// txb.signAllInputs(bitcoinjs.ECPair.fromWIF(req.wallet.srvkey, conf.blockchain.network));

		if (!('description' in req.body))
			return error.response(res, 'E3', { name: 'description', reason: 'missing' });

		let usd_price = null;
		let eur_price = null;

		try {
			const p = await Blockchain.getPrices();
			usd_price = value * p.usd;
			eur_price = value * p.eur;
		} catch (err) { }

		const cu = await Transaction.countDocuments({ 'wallet.id': req.wallet._id, $or: [{ status: 'signing' }, { status: 'waiting' }, { status: 'signed' }] }).exec();

		/* Crea il Transaction */
		const htx = new Transaction();
		htx.description = req.body.description;
		htx.hex = txb.toHex();
		htx.wallet = {
			id: req.wallet._id,
			address: req.wallet.address,
			label: req.wallet.label
		};
		htx.from = req.wallet.owner;
		htx.value = value;
		htx.fee = fee;
		htx.hardwareadmins = req.wallet.multisig.hardwareadmins;
		htx.hardwaretypes = req.wallet.multisig.hardwaretypes;
		htx.pubkeys = req.wallet.pubkeys;
		htx.to = destination;
		htx.n = req.wallet.multisig.n;
		htx.txid = htx._id;
		htx.signers = [];
		htx.admins = req.wallet.multisig.admins;
		htx.value_historic.usd = usd_price;
		htx.value_historic.eur = eur_price;
		htx.utxos = utxos;
		htx.scripttype = req.wallet.scripttype;

		let ror = null;
		if ('ror' in req.body)
			ror = await rorController.accept(req.body.ror, htx.to, htx.value, req.wallet.owner, htx.txid);

		if (ror != null) {
			htx.ror = ror._id;

			const metadata = Blockchain.meta.toOPReturn(Blockchain.meta.RORMetadata(ror));
			txb.addOutput({ script: metadata, value: 0 });
			htx.hex = txb.toHex();
		}

		try {
			await htx.save();
		} catch (err) {
			return error.response(res, 'E');
		}

		/* Invia la notifica agli admin */
		for (let i = 0; i < htx.admins.length; i++) {
			if (ror != null) {
				await notificationController.notify({
					user: htx.admins[i],
					email: true,
					code: 'signRORMultisig',
					data: {
						user: req.user.username, fullname: req.user.fullname, email: req.user.email, label: req.wallet.label,
						id: htx._id, description: htx.description, value: htx.value, to: htx.to, toname: ror.from
					},
					redirect: '?sign_multisig=1'
				});
			} else {
				await notificationController.notify({
					user: htx.admins[i],
					email: true,
					code: 'signMultisig',
					data: {
						user: req.user.username, fullname: req.user.fullname, email: req.user.email, label: req.wallet.label,
						id: htx._id, description: htx.description, value: htx.value, to: htx.to
					},
					redirect: '?sign_multisig=1'
				});
			}
		}

		res.status(200);
		res.json({ txhex: htx.hex, utxos: utxos });

		telegramHelper.notify(`User: ${req.wallet.owner} created a multisig withdraw of ${value} to ${destination} (script: ${req.wallet.scripttype})`);
	}
}
