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
import log = require('../../log');
import error = require('../../error');
import { $LightningCharityPotRoundDocument, LightningCharityPotRound } from './round.model';
import { LightningInvoice } from "../lightning/invoice.model";
import { getModuleConfiguration } from "../module";
import { LightningCharityPotConfig, LightningCharityPotModule } from ".";


export async function getCurrentRound(populate: boolean): Promise<$LightningCharityPotRoundDocument> {
	const q = LightningCharityPotRound.findOne({ status: 'running' });

	if (populate)
		return await q.populate('results.project', 'title media owner').exec();

	return await q.exec();
}

export async function updateCurrentRound() {
	const round: $LightningCharityPotRoundDocument = await getCurrentRound(false);

	if (!round)
		return;

	const payments = await LightningInvoice.find({
		'metadata.round': round._id.toString(),
		'metadata.type': 'charitypot',
		status: 'paid'
	}).exec();

	round.votes = payments.length;
	round.value = 0;

	const projects = {};

	for (let i = 0; i < payments.length; i++) {
		const p = payments[i];
		if (!('vote' in p.metadata))
			continue;

		if (!(p.metadata.vote in projects))
			projects[p.metadata.vote] = { project: p.metadata.vote, value: 0, votes: 0 };

		projects[p.metadata.vote].votes += 1;
		projects[p.metadata.vote].value += p.msatoshi;
		round.value += p.msatoshi;
	}

	round.results = Object.keys(projects).map(k => projects[k]).sort((a, b) => a.value.compare(b.value));

	await round.save();
};

export async function handleLightningPayment(invoice) {
	log.job.debug('Lightning.CharityPot', 'Updating current round triggered by a payment');
	await updateCurrentRound();
};


export async function currentRound(req: Request, res: Response) {
	const round = await getCurrentRound(true);

	if (!round)
		return error.response(res, 'E');

	res.status(200);
	res.json(round);
};


export async function rounds(req: Request, res: Response) {
	res.status(200);
	res.json({
		rounds: await LightningCharityPotRound.find({}).sort({ start: 'desc' }).exec()
	});
};


export async function stats(req: Request, res: Response) {
	const moduleConfig = getModuleConfiguration(LightningCharityPotModule) as LightningCharityPotConfig;

	const stats = await LightningCharityPotRound.aggregate()
		.match({})
		.group({
			_id: 1,
			votes: { $sum: '$votes' },
			value: { $sum: '$value' },
			rounds: { $sum: 1 }
		}).exec();

	stats[0].target = moduleConfig.minValue;

	res.status(200);
	res.json(stats[0]);
};
