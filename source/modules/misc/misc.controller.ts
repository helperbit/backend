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
import feedparser = require('feedparser-promised');
import fs = require('fs');
import multiparty = require('multiparty');
import error = require('../../error');
import mailHelper = require('../../helpers/mail');
import conf = require('../../conf');
import { Blockchain } from "../../blockchain";
// import therocktrading = require('../../helpers/therocktrading');
import flypme = require('../../helpers/flypme');
import { RedisCache } from "../../helpers/cache";
import { User } from "../user/user.model";
import { Project } from "../project/project.model";
import { Donation } from "../donation/donation.model";
import moment = require("moment");

const cache = new RedisCache();


/* GET api/search */
export async function search(req: Request, res: Response) {
	const q = req.query.q;
	const limit = 12;

	if (!q || q.length < 2) {
		res.status(200);
		return res.json({ results: [] });
	}

	const users = (await User.find({
		'activation.status': true,
		banned: false,
		usertype: { $ne: 'singleuser' },
		trustlevel: { $gt: 25 },
		username: { $regex: q as any, '$options': 'i' }
	}, 'avatar username fullname usertype trustlevel banned country regdate').limit(limit).exec())
		.map(n => {
			return {
				time: n.regdate,
				id: n.username,
				type: 'user',
				media: n.avatar,
				mainInfo: n.fullname.length > 0 ? n.fullname : n.username,
				secondaryInfo: n.usertype,
				tertiaryInfo: n.country
			}
		});

	const projects = (await Project.find({
		status: 'approved',
		$or: [
			{ 'title.en': { $regex: q, '$options': 'i' } },
			{ 'title.it': { $regex: q, '$options': 'i' } },
			{ 'title.es': { $regex: q, '$options': 'i' } }
		]
	}, 'media title owner countries start').limit(limit).exec())
		.map(n => {
			return {
				time: n.start,
				id: n._id,
				type: 'project',
				media: n.media.length > 0 ? n.media[0] : null,
				mainInfo: n.title,
				secondaryInfo: n.owner,
				tertiaryInfo: n.countries.length > 0 ? n.countries[0] : null
			}
		});

	const donations = (await Donation.find({
		status: 'confirmed',
		$or: [
			{ txid: { $regex: q as any, '$options': 'i' } },
		]
	}, 'txid tocountry to time value').limit(limit).exec())
		.map(n => {
			return {
				time: n.time,
				id: n.txid,
				type: 'donation',
				media: null,
				mainInfo: n.txid,
				secondaryInfo: n.to.length > 0 ? n.to[0].user : null,
				tertiaryInfo: n.value
			}
		});


	const results = []
		.concat(projects.sort((a, b) => moment(b.time).valueOf() - moment(a.time).valueOf()))
		.concat(users.sort((a, b) => moment(b.time).valueOf() - moment(a.time).valueOf()))
		.concat(donations.sort((a, b) => moment(b.time).valueOf() - moment(a.time).valueOf()))
		.slice(0, limit);

	res.status(200);
	res.json({ results: results });
}

/* GET api/info & api/info/base */
export interface PlatformInfo {
	fees?: Blockchain.Fee;
	prices?: Blockchain.Prices;
	fiatdonation: any;
	flypme?: {
		enabled: boolean;
		limits: flypme.FlypmeLimits;
	};
	blockchain: {
		network: 'testnet' | 'mainnet';
		height?: number;
	};
	policyversion: {
		terms: number;
		privacy: number;
	};
}

async function infoCommon(type: 'base' | 'extended'): Promise<PlatformInfo> {
	const jres: PlatformInfo = {
		blockchain: {
			network: conf.blockchain.testnet ? 'testnet' : 'mainnet'
		},
		fees: null,
		prices: null,
		fiatdonation: {
			available: 0.0,
			fixedcost: conf.fiatdonation.fixedcost,
			fee: conf.fiatdonation.fee,
			limits: conf.fiatdonation.limits,
			withdrawcost: conf.fiatdonation.withdrawcost
		},
		policyversion: {
			terms: conf.policyversion.terms,
			privacy: conf.policyversion.privacy
		}
	};


	jres.fees = await Blockchain.getFees();
	jres.prices = await Blockchain.getPrices();

	if (type != 'base') {
		jres.blockchain.height = await Blockchain.getHeightCached();
		jres.flypme = {
			enabled: false,
			limits: {}
		};

		try {
			// const bal = await therocktrading.getBalance('BTC');
			// jres.fiatdonation.available = bal.balance;
			jres.fiatdonation.available = 0.0;
		} catch (err) { }

		try {
			jres.flypme.limits = await flypme.limits();
			jres.flypme.enabled = true;
		} catch (err) { }
	}

	return jres;
}

export async function infoBase(req, res) {
	res.status(200);
	res.json(await infoCommon('base'));
}

export async function infoExtended(req, res) {
	res.status(200);
	res.json(await infoCommon('extended'));
}

/* GET api/blog */
export async function blog(req: Request, res: Response) {
	let lang = 'en';
	if ('lang' in req.params)
		lang = req.params.lang;

	let items = [];

	if (await cache.has('bp_' + lang)) {
		items = await cache.getJSON('bp_' + lang);
	} else {
		try {
			items = await feedparser.parse(`https://blog.helperbit.com/${lang}/feed/`)
			await cache.setJSON('bp_' + lang, items, 60 * 60);
		} catch (err) { }
	}

	items = items.slice(0, 4);
	items = items.map(bp => {
		return {
			date: bp.date,
			title: bp.title,
			summary: bp.summary.substring(0, 1024),
			link: bp.link
		}
	});

	res.status(200);
	res.json({ posts: items });
}


/* POST api/feedback */
export function feedback(req: any, res: Response) {
	const form = new multiparty.Form();

	form.on('error', (err) => { });
	form.parse(req, async (err, fields, files) => {
		/* If the user is authenticated, we get its email */
		if (req.user !== null) {
			req.body.email = req.user.email;
			fields.email = [req.user.email];
		}

		let email = null;
		let description = null;
		let file = null;

		if (err !== null || !('file' in files)) {
			if (!('email' in req.body || req.user !== null) || !('description' in req.body))
				return error.response(res, 'E3');

			email = req.body.email;
			description = req.body.description;
		} else {
			description = fields.description[0];
			email = fields.email[0];
			file = files.file[0];

			if (description === '' || email === '') {
				fs.unlinkSync(file.path);
				return error.response(res, 'E3');
			} else if (file === null) {
				fs.unlinkSync(file.path);
				return error.response(res, 'E');
			} else if (file.headers['content-type'].substring(0, 5) != 'image') {
				fs.unlinkSync(file.path);
				return error.response(res, 'E');
			}
		}

		const message = `The user ${email} has sent a feedback: ${description}`;
		try {
			await mailHelper.send('gessa@helperbit.com', `Feedback <${email}>`, message, file);
			res.status(200);
			res.json({});
			await mailHelper.send(email, `Feedback on Helperbit sent`, 'You sent a feedback to Helperbit Team; we will contact you as soon as possible.');
		} catch (err) {
			return error.response(res, 'E');
		}
	});
}

/* POST api/contact */
export function contact(req: Request, res: Response) {
	let message = `Message from: ${'firstname' in req.body ? req.body.firstname : ''}`;
	message += `${' ' + ('lastname' in req.body ? req.body.lastname : '')} <${req.body.email}>\n\n\n${req.body.message}`;

	mailHelper.send('info@helperbit.com', `[Contact] <${req.body.email}> ${req.body.subject}`, message)
		.then(() => {
			res.status(200);
			res.json({});
		})
		.catch(() => {
			return error.response(res, 'E');
		});
}


/* POST api/subscribe */
export function subscribe(req: Request, res: Response) {
	const email = req.body.email;
	let username: string = null;

	if ('username' in req.body)
		username = req.body.username;

	/* Connect to mailchimp */
	mailHelper.subscribe(email, username)
		.then(() => {
			res.status(200);
			res.json({});
		}).catch((e) => {
			return error.response(res, 'E');
		});
}
