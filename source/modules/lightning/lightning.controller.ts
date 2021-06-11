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
import { LightningInvoice, LightningInvoiceModel } from "./invoice.model";
import conf = require('../../conf');
import error = require('../../error');
import telegramHelper = require('../../helpers/telegram');
import lightningHelper = require('./lightning.helper')


export async function createInvoice(req: any, res: Response) {
	const inv = await lightningHelper.invoice(req.body.msat, req.body.metadata);
	if (!inv)
		return error.response(res, 'E');

	if (req.username)
		inv.user = req.username;

	await inv.save();

	telegramHelper.notify(`New lightning invoice of ${inv.msatoshi} msat created: ${inv.invoiceid} (${inv.metadata.type})`);
	res.status(200);
	res.json(inv);
}


export async function getInvoiceByID(req: Request, res: Response) {
	const inv = await LightningInvoiceModel.getByID(req.params.id);

	if (!inv)
		return error.response(res, 'E2');

	res.status(200);
	res.json(inv);
}

export async function getInvoiceByInvoiceID(req: Request, res: Response) {
	const inv = await LightningInvoiceModel.getByInvoiceID(req.params.id);

	if (!inv)
		return error.response(res, 'E2');

	res.status(200);
	res.json(inv);
}


export async function getInfo(req: Request, res: Response) {
	const stats = await LightningInvoice.aggregate()
		.match({ status: 'paid' })
		.group({
			_id: 1,
			volume: { $sum: '$msatoshi' },
			count: { $sum: 1 }
		}).exec();

	let info = null;
	let online = true;
	try {
		info = await lightningHelper._info();
	} catch (err) {
		online = false;
	}

	res.status(200);
	res.json({
		invoices: stats[0].count,
		volume: stats[0].volume,
		node: conf.services.lightning.node,
		online: online,
		nodeinfo: info
	});
}
