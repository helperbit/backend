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

import { Blockchain } from "../../blockchain";
import error = require('../../error');
import { Transaction, TransactionModel } from './transaction.model';
import { NextFunction, Response } from 'express';

/* Return a list of utxo currently broadcasted, signed, signing or waiting for an address */
export async function lockedUTXOs(address: string, multisig: boolean): Promise<Blockchain.UTXO[]> {
	if (!multisig)
		return [];

	const txs = await Transaction.find({
		'wallet.address': address,
		$or: [
			{ status: 'waiting' },
			{ status: 'signing' },
			{ status: 'signed' },
			{ status: 'broadcasted' }
		]
	}, 'utxos').exec();
	// console.log ('locked for', address, txs);

	if (txs == null)
		return Promise.reject();

	let utxos = [];

	for (let i = 0; i < txs.length; i++) {
		utxos = utxos.concat(txs[i].utxos);
	}

	return utxos;
}



/* Middleware: get the :txid multisig transaction */
export async function get(req: any, res: Response, next: NextFunction) {
	const tx = await TransactionModel.getByTxID(req.params.txid);
	if (tx === null)
		return error.response(res, 'E2');

	req.tx = tx;
	next();
}



export function getTransaction (req: any, res: Response) {
	const data: {
		status: string;
		from: string;
		to: any[];
		value: number;
		fee: number;
		txid: string;
		description: string;
		time: number;
		admins?: string[];
		signers?: string[];
		refused?: string[];
		ror?: string;
		value_historic: any;
	} = {
		"status": req.tx.status,
		"from": req.tx.from,
		"to": req.tx.to,
		"value": req.tx.value,
		"fee": req.tx.fee,
		"txid": req.tx.txid,
		"description": req.tx.description,
		"time": req.tx.time,
		"ror": req.tx.ror,
		"value_historic": req.tx.value_historic
	};

	/* If the user is the owner or and admin */
	if (req.user !== null && (req.user.username == req.tx.from || req.tx.admins.indexOf(req.user.email) != -1)) {
		data.admins = req.tx.admins;
		data.signers = req.tx.signers;
		data.refused = req.tx.refused;
	}

	res.status(200);
	res.json(data);
}



export async function getTransactions(req: any, res: Response) {
	const txs = await Blockchain.getTransactions(req.wallet.address);

	const txsm = txs.map((tx) => {
		return {
			txid: tx.tx,
			value: tx.value,
			time: tx.time,
			// status: tx.confirmations > 0 ? 'confirmed' : 'broadcasted',
			confirmations: tx.confirmations,
			in: tx.in
		};
	});
	res.status(200);
	res.json({ 'txs': txsm });
}
