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

import { LightningInvoice } from "./invoice.model";
import moment = require('moment');
import log = require('../../log');
import lightningHelper = require('./lightning.helper');

const moduleName = 'lightning';

// TODO: non funziona piu'
const handlePaymentTrigger = async (inv) => {
	try {
		// Modules.get('lightning.' + inv.metadata.type).controller().handleLightningPayment(inv);
	} catch (err) { };
};


let checking = false;
export async function checkPayment() {
	if (checking) return;
	checking = true;

	const datespan = new Date();
	const invoices = await LightningInvoice.find({ status: 'unpaid', expires_at: { $gt: datespan } }).exec();

	log.job.debug(moduleName, `Checking ${invoices.length} unpaid invoices...`);

	for (let i = 0; i < invoices.length; i++) {
		const ns = await lightningHelper.update(invoices[i]);
		if (ns) {
			const m = `Invoice ${invoices[i].invoiceid} (${invoices[i].metadata.type}) setting status: ${ns}`;
			log.job.debug(moduleName, m, { telegram: true });
			handlePaymentTrigger(invoices[i]);
		}
	}

	checking = false;
}

export async function checkExpired() {
	const datespan = moment().toDate();
	const invoices = await LightningInvoice.find({ status: 'unpaid', expires_at: { $lt: datespan } }).exec();

	log.job.debug(moduleName, `Setting ${invoices.length} invoices as expired...`);

	for (let i = 0; i < invoices.length; i++) {
		invoices[i].status = 'expired';
		invoices[i].save();
	}
}


export async function deleteExpired() {
	const datespan = moment().subtract(1, 'hours').toDate();
	const invoices = await LightningInvoice.find({ status: 'expired', expires_at: { $lt: datespan } }).exec();

	log.job.debug(moduleName, `Removing ${invoices.length} expired invoices.`);

	for (let i = 0; i < invoices.length; i++) {
		await LightningInvoice.deleteOne({ _id: invoices[i]._id });
	}
}


export async function streamPayment() {
	log.job.debug(moduleName, `Starting payment streaming`);

	lightningHelper.stream('payment', async (p) => {
		const inv = await LightningInvoice.findOne({ invoiceid: p.id }).exec();
		if (!inv)
			return;

		inv.status = p.status;
		inv.markModified('status');
		await inv.save();
		const m = `Invoice ${inv.invoiceid} (${inv.metadata.type}) setting status: ${inv.status}`;
		log.job.debug(moduleName, m, { telegram: true });

		handlePaymentTrigger(inv);
	});
}
