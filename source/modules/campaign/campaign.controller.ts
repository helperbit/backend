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

import { Request, Response, NextFunction } from "express";
import moment = require('moment');
import { Blockchain } from "../../blockchain";
import telegramHelper = require('../../helpers/telegram');
import error = require('../../error');
import conf = require('../../conf');
import log = require('../../log');
import mediaController = require('../media/media.controller');
import notificationController = require('../notification/notification.controller');
import { $CampaignDocument, Campaign, CampaignModel } from './campaign.model';
import { $DonationDocument, Donation } from "../donation/donation.model";
import { ProjectModel } from "../project/project.model";
import { QueryHelper } from "../../helpers/query";


/** Middleware per ottenere una campaign ownato dall'utente */
export async function get(req: any, res: Response, next: NextFunction) {
	const campaign = await Campaign.findOne({ _id: req.params.id, owner: req.username }).exec();
	if (campaign === null)
		return error.response(res, 'E2');

	req.campaign = campaign;
	next();
}


/* /api/campaign/:id */
export async function getByID(req: Request, res: Response) {
	const campaign = await CampaignModel.getByID(req.params.id);

	if (campaign == null)
		return error.response(res, 'E2')

	res.status(200);
	res.json(campaign);
}


async function checkResource(type, resource) {
	if (type != 'project')
		return false;

	try {
		const p = await ProjectModel.getByID(resource);
		if (p == null || p.status != 'approved')
			return false;

		return true;
	} catch (err) {
		return false;
	}
}

async function getMaxTarget(campaign) {
	if (campaign.type != 'project')
		return { amount: 10000000000000, currency: campaign.currency };

	const project = await ProjectModel.getByID(campaign.resource);
	return { amount: await Blockchain.convertCurrency(project.target, project.currency, campaign.currency), currency: campaign.currency };
}

async function checkMaxTarget(campaign) {
	if (campaign.type != 'project')
		return true;

	const maxtarget = await getMaxTarget(campaign);
	if (campaign.target > maxtarget.amount)
		return false;
	return true;
}


/* POST /api/campaign/create */
export async function create(req: any, res: Response) {
	/* Check if there is another active campaign (EC1) */
	const campaigns: $CampaignDocument[] = await Campaign.find({ owner: req.username, status: { $ne: 'concluded' } }).exec();
	if (campaigns.length > 0)
		return error.response(res, 'EC1');

	let c: $CampaignDocument = new Campaign();
	c.owner = req.user.username;

	if ('resource' in req.body && !(await checkResource(c.type, req.body.resource)))
		return error.response(res, 'EC4');

	c = c.safeUpdate(req.body);

	if ('target' in req.body && c.resource != null && !(await checkMaxTarget(c)))
		return error.response(res, 'EC5', { max: await getMaxTarget(c) });

	if ('resource' in req.body && !(await checkMaxTarget(c)))
		c.target = (await getMaxTarget(c)).amount;

	/* From start */
	if (!c.checkCompletness())
		return error.response(res, 'EC3');

	if (!checkResource(c.type, c.resource))
		return error.response(res, 'EC3');

	c.status = 'started';
	c.start = new Date();

	if (moment(c.end) > moment(c.start).add(30, 'days') || c.end == null)
		c.end = moment(c.start).add(30, 'days').toDate();

	if (moment(c.end) < moment(c.start).add(6, 'hours'))
		c.end = moment(c.start).add(6, 'hours').toDate();

	const changes = QueryHelper.detectChanges(c, ['title', 'description', 'target'], true);
	if (changes != null) {
		c.changeHistory.push({ content: changes });
	}

	await c.save();
	res.status(200);
	res.json({ id: c._id });
	telegramHelper.notify(`User ${req.username} created the campaign ${c._id}. ${conf.url}/campaign/${c._id}`);
}


/* POST /api/campaign/:id/edit */
export async function edit(req: any, res: Response) {
	if (req.campaign.status == 'concluded')
		return error.response(res, 'EC6');

	req.campaign = req.campaign.safeUpdate(req.body, ['title', 'description']);

	const changes = QueryHelper.detectChanges(req.campaign, ['title', 'description', 'target']);
	if (changes != null) {
		if (!req.campaign.changeHistory)
			req.campaign.changeHistory = [];
		req.campaign.changeHistory.push({ content: changes });
		req.campaign.markModified('changeHistory');
	}


	/* From start */
	if (!req.campaign.checkCompletness())
		return error.response(res, 'EC3');

	req.campaign.status = 'started';


	await req.campaign.save();
	res.status(200);
	res.json({});
	telegramHelper.notify(`User ${req.username} edited the campaign ${req.campaign._id}.`);
}


/* POST /api/campaign/:id/delete */
export async function remove(req: any, res: Response) {
	if (req.campaign.status == 'concluded' || req.campaign.receiveddonations > 0)
		return error.response(res, 'EC2');

	if (req.campaign.media)
		await mediaController.removeMedia(req.campaign.media);

	await Campaign.remove({ _id: req.campaign._id });
	res.status(200);
	res.json({});

	telegramHelper.notify(`User ${req.username} deleted the campaign ${req.campaign._id}.`);
}



/* POST /api/campaign/:id/giftmessages */
export async function giftmessages(req: any, res: Response) {
	if (req.username != req.campaign.owner)
		return error.response(res, 'E6');

	const donations = await Donation.find({ 'gift.enabled': true, campaign: req.params.id }).select('+gift').exec();

	res.status(200);
	res.json({
		messages: donations.map(d => {
			return {
				message: d.gift.message,
				name: d.gift.name
			};
		})
	});
}


/* POST /api/campaign/:id/media */
export async function uploadMedia(req: any, res: Response) {
	if (req.campaign.status == 'concluded')
		return error.response(res, 'EC6');

	if (req.campaign.media)
		await mediaController.removeMedia(req.campaign.media);

	const rim = await mediaController.upload(req, res, {
		maxwidth: 1024,
		container: 'campaign',
		filename: '' + req.campaign._id,
		types: ['image']
	});

	req.campaign.media = rim.image._id;
	await req.campaign.save();
	res.status(200);
	res.json({ id: rim.image._id });
}

/* POST /api/campaign/:id/media/remove */
export async function removeMedia(req: any, res: Response) {
	if (req.campaign.status == 'concluded')
		return error.response(res, 'EC6');

	if (req.campaign.media)
		await mediaController.removeMedia(req.campaign.media);
	await req.campaign.save();
	res.status(200);
	res.json({});
}


/* POST /api/me/campaigns */
export async function getList(req: any, res: Response) {
	const campaigns = await Campaign.find({ owner: req.username }).sort({ 'start': 'desc' }).exec();

	res.status(200);
	res.json({ campaigns: campaigns || [] });
}



/* Update campaign statistics with a new donation */
export async function handleDonation(donation: $DonationDocument) {
	try {
		const campaign = await CampaignModel.getByID(donation.campaign);
		campaign.received += donation.value;
		campaign.receiveddonations += 1;
		if (campaign.currency != 'BTC' && campaign.currency.toLowerCase() in donation.value_historic)
			campaign.receivedconverted += donation.value_historic[campaign.currency.toLowerCase()];
		else
			campaign.receivedconverted += donation.value;
		campaign.updatePercentage();
		await campaign.save();

		await notificationController.notify({
			user: campaign.owner,
			email: true,
			code: 'donationCampaignReceived',
			data: { fromcountry: donation.fromcountry, from: (donation.from || donation.fromaddress), amount: donation.value },
			redirect: campaign._id
		});

		if (campaign.status == 'concluded') {
			await notificationController.notify({
				user: campaign.owner,
				email: true,
				code: 'campaignConcluded',
				data: {},
				redirect: campaign._id
			});
		}
	} catch (err) {
		log.critical('Campaign', `Cannot update campaign statistics with donation ${donation.txid}`);
	}
}
