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
import { AdminBulkMail } from "../mailtool.model";
import { User } from "../../user/user.model";
import { AdminUser } from "../../admin.user/user.model";
import { Event } from "../../event/event.model";

const ObjectId = require('mongoose').Types.ObjectId; 
import express = require('express');
import moment = require('moment');
import AdminLogController = require('../../admin.log/log.controller');
import conf = require('../../../conf');
import mailHelper = require('../../../helpers/mail');
import {checkLogin } from '../../admin/auth';

const countries = require('../../../data/country.json');
const router = express.Router();

router.get('/mailtool/list', checkLogin, async (req: Request, res: Response) => {
	const bm = await AdminBulkMail.find({}).sort({ time: 'desc' }).exec();

	res.render('admin.mailtool/admin/list', {
		page: 'mailtool',
		list: bm
	});
});


router.post('/mailtool/sendtest', checkLogin, async (req: any, res: Response) => {
	const email = (await AdminUser.findOne({username: req.session.user}, 'email').exec()).email;
	await mailHelper.send(email, req.body.subject, req.body.message);
	res.status(200);
	res.json({email: email});
});

router.post('/mailtool/send', checkLogin, async (req: Request, res: Response) => {
	const bm = new AdminBulkMail();
	bm.users = req.body.users;
	bm.doneusers = [];
	bm.message = req.body.message;
	bm.subject = req.body.subject;
	bm.iscommercial = req.body.iscommercial;
	bm.filter = req.body.filter;
	bm.status = 'sending';

	try {
		await bm.save();
		AdminLogController.operation(req, 'Mailtool', `Sending a bulkmail to ${bm.users.length} users: ${bm.subject}`);
		res.status(200);
		res.json({});
	} catch (err) {
		res.status(500);
		res.json({});
	}
});

router.post('/mailtool/cancel', checkLogin, async (req: Request, res: Response) => {
	const b = await AdminBulkMail.findOne({ _id: req.body.id }).exec();
	b.status = 'canceled';
	await b.save();
	res.status(200);
	res.json({});
});

router.get('/mailtool/send', checkLogin, async (req: Request, res: Response) => {
	const filter = {
		usertype: req.query.usertype || 'all',
		wallet: req.query.wallet || 'all',
		geoloc: req.query.geoloc || 'all',
		country: req.query.country || 'WRL',
		mintrust: req.query.mintrust as any || 0,
		maxtrust: req.query.maxtrust as any || 100,
		lastmail: req.query.lastmail || 'none',
		lang: req.query.lang || 'all',
		event: req.query.event || 'none',
		minprivacy: req.query.minprivacy || conf.policyversion.privacy
	};

	const query: any = {};
	if (filter.usertype != 'all')
		query.usertype = filter.usertype;
	if (filter.wallet == 'nowallet')
		query.receiveaddress = '';
	if (filter.wallet == 'wallet')
		query.receiveaddress = { $ne: '' };
	if (filter.geoloc == 'nogeoloc')
		query['location.coordinates'] = [];
	if (filter.geoloc == 'geoloc')
		query['location.coordinates'] = { $ne: [] };
	if (filter.country != 'WRL')
		query.country = filter.country;
	if (filter.lang != 'all')
		query.lang = filter.lang;
	query.$and = [{ 'policyversion.privacy': { $gte: filter.minprivacy } }, { trustlevel: { $gt: parseInt(filter.mintrust) } }, { trustlevel: { $lt: parseInt(filter.maxtrust) } }];

	let users = await User.find(query, 'email username').exec();

	/* Filter by affected in event */
	if (filter.event != 'none') {
		const ev = await Event.findOne({ _id: new ObjectId(filter.event) }, 'affectedusers').exec();
		users = users.filter(u => ev.affectedusers.indexOf(u.username) != -1);
	}

	/* Filter for lastmail */
	if (filter.lastmail !== 'none') {
		const q: any = {
			time: { $gt: moment().subtract(parseInt(filter.lastmail[0]), 'months') }
		};

		if (filter.lastmail[1] === 'c')
			q.iscommercial = true;

		const bms = await AdminBulkMail.find(q, 'doneusers users status').exec();

		const doneusers = bms.reduce((prev, curr) => {
			if (curr.status == 'sending')
				return prev.concat(curr.doneusers.concat(curr.users));
			else
				return prev.concat(curr.doneusers);
		}, []);

		users = users.filter(u => doneusers.indexOf(u.username) === -1);
	}

	const populatedevents = await Event.find({ affectedusers: { $ne: [] } }, '_id lastshakedate type affectedcountries maxmagnitude affectedusers')
		.sort({ 'lastshakedate': 'desc' })
		.exec();

	res.render('admin.mailtool/admin/send', {
		populatedevents: populatedevents,
		countries: countries,
		page: 'mailtool',
		filtered: users,
		filteredcount: users.length,
		message: "Message",
		subject: 'Subject',
		filter: filter
	});
});

export const AdminMailToolApi = router;
