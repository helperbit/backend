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

import { Transaction } from "./transaction.model";
import log = require('../../log');
import conf = require('../../conf');
import { Blockchain } from "../../blockchain";
import { Async } from "../../helpers/async";
import projectController = require('../project/project.controller');

const moduleName = 'wallet.transaction';

export async function broadcastCheck() {
	const pushTx = async tx => {
		const txid = await Blockchain.pushTransactionAll(tx.hex);
		log.job.debug(moduleName, `${tx.txid || txid} broadcasted`);
		tx.status = 'broadcasted';
		await tx.save();
	};

	const txs = await Transaction.find({ status: 'signed' }, 'hex txid status').exec();
	log.job.debug(moduleName, `Checking ${txs.length} not broadcasted`);

	await Async.forEach(txs, async (tx) => {
		try {
			const txinfo = await Blockchain.getTransaction(tx.txid);
			if (txinfo.txid == tx.txid) {
				log.job.debug(moduleName, `${tx.txid} already broadcasted, marked`);
				tx.status = 'broadcasted';
				await tx.save();
			} else {
				pushTx(tx);
			}
		} catch (err) {
			pushTx(tx);
		}
	});
}

/* Chiamata periodicamente, controlla le transazioni pendenti (non confermate);
 * se il numero di conferme supera quello minimo -> pending = true,
 * se la transazione non esiste viene eliminata */
export async function confirmationCheck() {
	/* Check for broadcasted */
	const txs = await Transaction.find({ status: 'broadcasted' }).exec();
	log.job.debug(moduleName, `Checking ${txs.length} unconfirmed transactions`);

	await Async.forEach(txs, async d => {
		if (!d || !d.txid || d.txid.indexOf('.') != -1) return;

		try {
			const tx = await Blockchain.getTransaction(d.txid);

			if (tx.confirmations >= conf.blockchain.limits.min.donationconf) {
				d.status = 'confirmed';
				d.save();

				log.job.debug(moduleName, `${tx.txid} confirmed`);

				/* Check if it's running a project, update used */
				return projectController.updateProjectBalances(d.wallet.address, d.from, d.value);
			} else if (tx === null && false /* DATE check */) {
				// Donation.remove({ _id: d._id }, (err) => { });
			}
		} catch (err) { }
	});
}
