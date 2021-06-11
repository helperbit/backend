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
import { ProposedNPO } from "./proposednpo.model";
import error = require('../../error');
import telegramHelper = require('../../helpers/telegram');
import badgeController = require('../user.badge/badge.controller');


/* GET API/proposednpo/ */
export async function getList(req: Request, res: Response) {
	const q: { verified: boolean; name?: RegExp } = { verified: true };

	if ('query' in req.query)
		q.name = /.*(req.query).*/;

	const mwn = await ProposedNPO.find(q).sort({ 'endorsment': 'desc' }).exec();
	res.status(200);
	res.json({ proposednpo: mwn || [] });
}


/* POST API/proposednpo/insert */
export async function insert(req: any, res: Response) {
	const dmwn = await ProposedNPO.findOne({ name: req.body.name }).exec();
	if (dmwn !== null)
		return error.response(res, 'EMWN3');

	const mwn = new ProposedNPO();
	mwn.country = req.body.country || 'WRL';
	mwn.link = req.body.link || '';
	mwn.name = req.body.name;

	if (!mwn.link.startsWith('http') && mwn.link.length > 4)
		mwn.link = 'http://' + mwn.link;

	mwn.reporter = req.username || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	try {
		await mwn.save();
		res.status(200);
		res.json({});

		telegramHelper.notify(`User ${req.username} proposed an NPO ${mwn.name} (${mwn.country}) ${mwn.link}; review required by an admin.`);
	} catch (err) {
		return error.response(res, 'E');
	}
}


/* POST API/Proposednpo/:id/endorse */
export async function endorse(req: any, res: Response) {
	const npo = await ProposedNPO.findOne({ verified: true, _id: req.params.id }, 'endorsedbyusers endorsedbyips endorsment').exec();
	if (npo === null)
		return error.response(res, 'E');
	if (req.username !== null && npo.endorsedbyusers.indexOf(req.username) != -1)
		return error.response(res, 'EMWN2');
	else if (req.username === null && npo.endorsedbyips.indexOf(req.headers['x-forwarded-for'] || req.connection.remoteAddress) != -1)
		return error.response(res, 'EMWN1');

	npo.endorsment += 1;

	if (req.username !== null)
		npo.endorsedbyusers.push(req.username);
	else
		npo.endorsedbyips.push(req.headers['x-forwarded-for'] || req.connection.remoteAddress);

	await npo.save();

	res.status(200);
	res.json({ endorsment: npo.endorsment });

	if (req.username !== null)
		await badgeController.updateUserBadges(req.username);
}
