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
import shortid = require('shortid');
import metainspector = require('node-metainspector');
import AdminLogController = require('../../admin.log/log.controller');
import mediaController = require('../../media/media.controller');
import eventController = require('../event.controller');
import {checkLogin, checkAuth } from '../../admin/auth';
import conf = require('../../../conf');
import error = require('../../../error');
import log = require('../../../log');
import { $EventDocument, Event, EventModel } from '../event.model';
import { User } from "../../user/user.model";
import { s2o } from "../../../helpers/query";
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";

const countries = require('../../../data/country.json');
const router = require('express').Router();

router.get('/events', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Event.find({}, '-shakemaps -geometry').sort({ lastshakedate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('event/admin/list', { page: 'event', title: 'All', events: data.results, pagination: data.pagination });
});

router.get('/events/withusers', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Event.find({ affectedusers: { $ne: [] } }, '-shakemaps -geometry').sort({ lastshakedate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('event/admin/list', { page: 'event', title: 'With users', events: data.results, pagination: data.pagination });
});

router.get('/events/alert', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Event.find({ datasource: 'alert' }, '-shakemaps -geometry').sort({ lastshakedate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('event/admin/list', { page: 'event', title: 'From alerts', events: data.results, pagination: data.pagination });
});

router.get('/events/alert/notvisible', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Event.find({ datasource: 'alert', visible: false }, '-shakemaps -geometry').sort({ lastshakedate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('event/admin/list', { page: 'event', title: 'From alerts (hidden)', events: data.results, pagination: data.pagination });
});


router.get('/event/create', checkAuth('operator'), (req: Request, res: Response) => {
	const ev: $EventDocument = new Event();
	const e: any = ev.toJSON();
	e._id = 'null';
	e.visible = false;
	e.lastshakedate = new Date();
	e.article = {};
	res.render('event/admin/detail', { page: 'event', event: e, countries: countries, affus: [] });
});

router.get('/event/:id', checkLogin, async (req: Request, res: Response) => {
	const data = await EventModel.getByID(req.params.id, '-affectedusers');
	if (data === null)
		return res.redirect('/admin/events');

	const event = await EventModel.getByID(req.params.id, 'affectedusers');
	if (event === null)
		return error.response(res, 'E');

	const affus = await User.find({
		username: { $in: event.affectedusers },
		receiveaddress: { $ne: '' }
	}, 'username trustlevel location avatar usertype receiveaddress received').exec();

	res.status(200);

	if (affus === null)
		res.render('event/admin/detail', { page: 'event', event: data, countries: countries, affus: [] });

	res.render('event/admin/detail', { page: 'event', event: data, countries: countries, affus: affus });
});


router.post('/event/:id/reloadaffected', checkAuth('admin'), async (req: Request, res: Response) => {
	const event = await EventModel.getByID(req.params.id);
	eventController.updateAffectedUsersForEvent(event);
	res.status(200);
	res.json({});
	AdminLogController.operation(req, 'Event', `Reloaded affected user for ${req.params.id}`);
});

router.post('/event/:id/fakeusers', checkAuth('admin'), async (req: Request, res: Response) => {
	if (conf.env == 'mainnet') {
		res.status(200);
		res.json({});
	}

	const createFakeUser = async (event) => {
		const user = new User();
		if (['company', 'singleuser', 'npo'].indexOf(req.body.type) != -1)
			user.usertype = req.body.type;
		else {
			user.usertype = 'npo';
			user.subtype = req.body.type;
		}
		user.username = `test${event.affectedcountries[0]}${shortid.generate().replace('-', '')}`;
		user.password = 'test';
		user.receiveaddress = 'mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ';
		user.email = `${user.username}@gmail.com`;
		user.location = {
			type: 'Point', coordinates: [
				event.epicenter.coordinates[0] + (Math.random() - 0.5) / 5,
				event.epicenter.coordinates[1] + (Math.random() - 0.5) / 5]
		};
		try {
			await user.save();
			log.debug('Admin', `Created fake user ${user.username} for event ${event._id}`);
			eventController.updateAffectedUsersForEvent(event);
			return;
		} catch (err) {
			return;
		}
	};

	const event = await EventModel.getByID(req.params.id);
	for (let i = 0; i < req.body.n; i++) {
		await createFakeUser(event);
		res.status(200);
		res.json({});
	}
});


/* Upload a media for the event */
router.post('/event/:id/media', checkAuth('operator'), async (req: Request, res: Response) => {
	const ev = await EventModel.getByID(req.params.id);
	const rim = await mediaController.upload(req, res, {
		container: 'event',
		filename: `${req.params.id}_${shortid.generate()}`,
		maxwidth: 600,
		// admin: true
	});
	if (rim.image !== null) {
		ev.images.push(rim.image._id);
		await ev.save();
	}
	res.status(200);
	res.json({});
	AdminLogController.operation(req, 'Event', `Uploaded new media for event: ${req.params.id}`);
});


router.post('/event/:id/media/:mid/remove', checkAuth('operator'), async (req: Request, res: Response) => {
	const ev = await EventModel.getByID(req.params.id);
	await mediaController.removeMedia(req.params.mid);
	ev.images.splice(ev.images.indexOf(s2o(req.params.mid)), 1);
	await ev.save();
	res.status(200);
	res.json({});
});



/* Upload an article */
router.post('/event/:id/article', checkAuth('operator'), async (req: Request, res: Response) => {
	const ev = await EventModel.getByID(req.params.id);
	ev.article[req.body.lang] = req.body.text;
	ev.markModified("article");

	await ev.save();
	res.status(200);
	res.json({});
});


router.delete('/event/:id/article/:lang', checkAuth('operator'), async (req: Request, res: Response) => {
	const ev = await EventModel.getByID(req.params.id);
	delete ev.article[req.params.lang];
	ev.markModified("article");

	await ev.save();
	res.status(200);
	res.json({});
});


/* News */
router.post('/event/:id/news/add', checkAuth('operator'), async (req: Request, res: Response) => {
	const ev = await EventModel.getByID(req.params.id);
	const client = new metainspector(req.body.url, { timeout: 5000 });
	client.on('fetch', async () => {
		ev.news.push({ title: client.title, image: client.image, lang: req.body.lang, url: req.body.url });
		ev.markModified("news");

		await ev.save();
		res.status(200);
		res.json({});
	});

	client.on('error', () => {
		res.status(200);
		res.json({});
	});

	client.fetch();
});

router.post('/event/:id/news/remove', checkAuth('operator'), async (req: Request, res: Response) => {
	const ev = await EventModel.getByID(req.params.id);
	for (let i = 0; i < ev.news.length; i++) {
		if (ev.news[i].url == req.body.url) {
			ev.news.splice(i, 1);
			ev.markModified("news");
			await ev.save();
			res.status(200);
			return res.json({});
		}
	}
	res.status(200);
	res.json({});
});




router.post('/event/:id/delete', checkAuth('admin'), async (req: Request, res: Response) => {
	await Event.remove({ _id: req.params.id }).exec();
	res.status(200);
	res.json({});
});


router.post('/event/:id/edit', checkAuth('operator'), async (req: Request, res: Response) => {
	let id = req.params.id;

	if (id != 'null') {
		await Event.updateOne({ _id: req.params.id }, { $set: req.body }).exec();

		/* Check if we need to add an earthquake to a manual event */
		const event = await EventModel.getByID(req.params.id);

		if (event.datasource == 'manual') {
			event.earthquakes = [];
			if (event.lastshakedate != null && event.epicenter.coordinates.length >= 2) {
				event.earthquakes = [{
					magnitude: event.maxmagnitude,
					date: event.lastshakedate,
					epicenter: event.epicenter
				}];
			}

			await event.save();
		}

		res.status(200);
		res.json({ _id: req.params.id });
	} else {
		req.body.originid = shortid.generate();
		req.body.dataid = shortid.generate();
		const ev = new Event(req.body);

		try {
			await ev.save();
			res.status(200);
			res.json({ _id: ev._id });
		} catch (err) {
			res.status(500);
			res.json({ error: 'E', message: err });
		}
		id = ev._id;
	}
});


export const EventAdminApi = router;
