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

import conf = require('../../conf');
import { $LightningInvoiceDocument, LightningInvoice } from './invoice.model';
const chargeClient = require('lightning-charge-client')(`http://${conf.services.lightning.host}:${conf.services.lightning.port}`, conf.services.lightning.token);

export function _invoice(sat: number, meta: any) {
	return chargeClient.invoice({
		msatoshi: sat,
		metadata: meta,
		description: 'Helperbit Invoice',
		expiry: 60 * 60
	});
}

export function _wait(invid: string, timeout?: number) {
	return chargeClient.wait(invid, timeout || 3);
}

export function _stream(what: 'payment', handler: (d: any) => void) {
	return chargeClient.stream().on(what, handler);
}

export function _fetch(invid: string) {
	return chargeClient.fetch(invid);
}

export function _fetchAll(invid: string) {
	return chargeClient.fetchAll();
}

export function _info() {
	return chargeClient.info();
}

export async function invoice(msat: number, metadata: any) {
	const invoice = await _invoice(msat, metadata);

	const invDoc = new LightningInvoice();
	invDoc.status = invoice.status;
	invDoc.msatoshi = parseInt(invoice.msatoshi);
	invDoc.metadata = invoice.metadata;
	invDoc.invoiceid = invoice.id;
	invDoc.rhash = invoice.rhash;
	invDoc.payreq = invoice.payreq;
	invDoc.expires_at = (invoice.expires_at * 1000) as any;
	invDoc.created_at = (invoice.created_at * 1000) as any;
	return invDoc;
}

export async function update(inv: string | $LightningInvoiceDocument) {
	let invid = null;
	let invdoc = null;

	if (typeof (inv) != 'string') {
		invid = inv.invoiceid;
		invdoc = inv;
	} else {
		invid = inv;
		invdoc = await LightningInvoice.findOne({ invoiceid: invid }).exec();
	}

	const pin = await _fetch(invid);

	if (pin.status != invdoc.status) {
		invdoc.status = pin.status;
		invdoc.markModified('status');
		await invdoc.save();
		return pin.status;
	}

	return null;
};

export function stream(what: 'payment', handler: (d: any) => void) {
	_stream(what, handler);
};
