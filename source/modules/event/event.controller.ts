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
import error = require('../../error');
import log = require('../../log');
import geoquadController = require('../geoquad/geoquad.controller');;
import telegramHelper = require('../../helpers/telegram');
import { $EventDocument, Event, EventModel } from './event.model';
import { $UserDocument, User } from "../user/user.model";
import { Project } from "../project/project.model";
import { QueryHelper } from "../../helpers/query";
import { getModuleConfiguration } from "../module";
import { EventModule, EventConfig } from ".";


export async function updateAffectedUsersAfterUserGeoloc(user: $UserDocument) {
	/* Get users not in area */
	let events = await Event.find({
		affectedusers: user.username,
		$or: [
			{
				$and: [
					{ geometry: { $not: { $geoIntersects: { $geometry: user.location } } } },
					{ 'shakemaps.geometry': { $not: { $geoIntersects: { $geometry: user.location } } } }
				]
			},
			{ lastshakedate: { $lt: user.regdate } }
		]
	}).exec();

	if (events === null)
		return;

	for (let i = 0; i < events.length; i++) {
		const index = events[i].affectedusers.indexOf(user.username);

		if (index == -1)
			continue;

		events[i].affectedusers.splice(index, 1);
		await events[i].save();
		log.debug('event', `Remove ${user.username} from event ${events[i]._id} (${events[i].affectedusers.length} users)`);
	}

	/* Get users in area */
	events = await Event.find({
		lastshakedate: { $gt: user.regdate },
		$or: [
			{ geometry: { $geoIntersects: { $geometry: user.location } } },
			{ 'shakemaps.geometry': { $geoIntersects: { $geometry: user.location } } }
		]
	}).exec();

	if (events === null || events.length === 0)
		return;

	for (let i = 0; i < events.length; i++) {
		const index = events[i].affectedusers.indexOf(user.username);

		if (index != -1) continue;

		events[i].affectedusers.push(user.username);
		await events[i].save();
		log.debug('event', `Add ${user.username} to event ${events[i]._id} (${events[i].affectedusers.length} users)`);
	}
}

export async function updateAffectedUsersForEvent(event: $EventDocument) {
	let event_n = 0;

	const updateAffected = async (users: $UserDocument[]) => {
		if (users.length > 0)
			log.job.debug('event', `Found ${users.length} users within the event ${event._id} (${event.type})`);

		const before = event.affectedusers.length;
		event_n++;
		event.affectedusers = [];
		for (let i = 0; i < users.length; i++) {
			if (users[i].username != 'helperbit')
				event.affectedusers.push(users[i].username);
		}
		await event.save();

		if (before != event.affectedusers.length) {
			log.job.debug('event', `Affected users for event ${event._id} (${event.type}) updated: ${users.length} users (${(users.length - before)})`);
			telegramHelper.notify(`Affected users for event ${event._id} (${event.type}) updated: ${users.length} users (${(users.length - before)})`);
		}
	};

	interface Query {
		$or?: any;
		location?: any;
		regdate?: any;
	}

	// log.job.debug('event', `Updating affected users for event ${event._id}`);

	const q: Query = { regdate: { $lt: event.lastshakedate } };
	const qfallback: Query = { regdate: { $lt: event.lastshakedate } };

	/* geowithin query part */
	if (event.shakemaps.length > 0) {
		q.$or = [];

		for (let i = 0; i < event.shakemaps.length; i++)
			q.$or.push({ location: { $geoWithin: { $geometry: event.shakemaps[i].geometry } } });

		qfallback.location = { $geoWithin: { $geometry: event.geometry } };
	} else {
		q.location = { $geoWithin: { $geometry: event.geometry } };
	}

	try {
		let users: $UserDocument[] = await User.find(q, 'username regdate banned').exec();
		users = users.filter(u => !u.banned);
		await updateAffected(users);
	} catch (err) {
		// console.log(err, event.originid);
		log.job.debug('event', `Affected users for event ${event._id} (${event.type}) error: invalid geometry ${event.originid}`);

		/* If shakemaps are not good, fallback to geometry */
		if (event.shakemaps.length !== 0) {
			log.job.debug('event', `Affected users for event ${event._id} (${event.type}), fallback to geometry...`);
			let users = await User.find(qfallback, 'username banned').exec();
			users = users.filter(u => !u.banned);
			await updateAffected(users);
		}
	}
}

/* api/event/:id/affectedusers */
export async function getAffectedUsers(req: Request, res: Response) {
	const eid = req.params.id;

	const event: $EventDocument = await EventModel.getByID(eid, 'affectedusers');
	if (event === null)
		return error.response(res, 'E');

	let affus: $UserDocument[] = await User.find({
		username: { $in: event.affectedusers },
		receiveaddress: { $ne: '' }
	}, 'username banned trustlevel location avatar usertype subtype receiveaddress received').exec();

	if (affus === null)
		return error.response(res, 'E');

	/* Obfuscate singleuser position */
	let singleusers = affus.filter(item => {
		return item.usertype == 'singleuser';
	});
	singleusers = singleusers.map(u => {
		u.location = { coordinates: [], type: 'Point' };
		return u;
	});

	/* Filter users by trustlevel */
	affus = affus.filter(item => !item.banned);
	affus = affus.filter(item => item.usertype == 'singleuser' || item.trustlevel >= 50);

	const projects = await Project.find({ event: eid, status: 'approved' }, 'title owner media received used pending target currency').exec();
	const geoquads = await geoquadController.getEventAffectedUserGeoQuads(singleusers.map(u => { return u.username; }));

	res.status(200);
	res.json({
		'geoquads': geoquads,
		'singleuser': singleusers,
		'projects': projects,
		'company': affus.filter(item => { return item.usertype == 'company'; }),
		'npo': affus.filter(item => { return item.usertype == 'npo' && item.subtype == 'none'; }),
		'school': affus.filter(item => { return item.subtype == 'school' && item.usertype == 'npo'; }),
		'park': affus.filter(item => { return item.subtype == 'park' && item.usertype == 'npo'; }),
		'munic': affus.filter(item => { return item.subtype == 'municipality' && item.usertype == 'npo'; }),
		'cultural': affus.filter(item => { return item.subtype == 'cultural' && item.usertype == 'npo'; }),
		'hospital': affus.filter(item => { return item.subtype == 'hospital' && item.usertype == 'npo'; }),
		'civilprotection': affus.filter(item => { return item.subtype == 'civilprotection' && item.usertype == 'npo'; })
	});
}


/* GET api/events/list */
export async function getList(req: Request, res: Response) {
	const moduleConfig = getModuleConfiguration(EventModule) as EventConfig;

	const fquery: any = {};
	const country = req.body.country || null;
	const types = req.body.types || null;
	const sort = req.body.orderby || 'earthquakes.date';
	const sortdir = req.body.sort || 'desc';
	const qsort = {};
	qsort[sort] = sortdir;

	if (req.body.populated)
		fquery.affectedusers = { $exists: true, $ne: [] };

	if (country !== null && country !== '')
		fquery.affectedcountries = country;
	if (types !== null)
		fquery.type = { $in: types };
	fquery.visible = true;
	fquery.startdate = { $ne: null };

	// TODO: questa query usa configurazioni di altra roba
	const unwindMatch = {
		$or: [
			{ "population.affected": { $gt: 1000 } },
			{
				$and: [
					{ "earthquakes.magnitude": { $gt: moduleConfig.earthquake.minShakeMagnitude } },
					{ "issea": false }
				]
			},
			{
				$and: [
					{ "earthquakes.magnitude": { $gt: moduleConfig.earthquake.minSeaMagnitude } },
					{ "issea": true }
				]
			}
		]
	};

	const selector = {
		geometry: 0,
		shakemaps: 0
	};

	const q = Event.aggregate()
		.project(selector)
		.match(fquery)
		.unwind("earthquakes")
		.match(unwindMatch)
		.sort(qsort);

	const events = await QueryHelper.paginationApply(req, q).exec();

	const count = (await Event.aggregate()
		.project(selector)
		.match(fquery)
		.unwind("earthquakes")
		.match(unwindMatch)
		.group({ _id: null, n: { $sum: 1 } })
		.exec())[0].n;
		
	res.status(200);
	res.json({ events: events, count: count });
}


/* GET api/events/all */
export async function getAll(req: Request, res: Response) {
	const events = await Event.find({ visible: true }, '_id type epicenter lastshakedate timezone startdate maxmagnitude affectedcountries').sort({ startdate: 'asc' }).exec();

	res.status(200);
	res.json({ events: events });
}


/* GET api/events/main */
export async function getMainList(req: Request, res: Response) {
	const selector = '-geometry -area -shakemaps';
	
	const events = await Event.find({ visible: true, mainevent: true }, selector)
		.sort({ "lastshakedate": "desc" })
		.limit(4)
		.exec();

	if (events.length < 4) {
		const events2 = await Event.find({ visible: true, issea: false, "earthquakes.magnitude": { $gt: 5.69 } }, selector)
			.sort({ "lastshakedate": "desc" })
			.limit(8)
			.exec();

		const missing = 4 - events.length;

		for(let i = 0; i < missing; i++)
			events.push (events2[i]);
	}

	res.status(200);
	res.json({ closetome: [], main: events });

	/*
	let mevents = await Event.aggregate()
		.match({ visible: true, datasource: { $ne: 'alert' } })
		.unwind("earthquakes")
		.match({
			$or: [
				{
					$and: [
						{ "earthquakes.magnitude": { $gt: 5.69 } },
						{ "issea": false }
					]
				},
				{
					$and: [
						{ "earthquakes.magnitude": { $gt: 5.9 } },
						{ "issea": true }
					]
				}
			]
		})
		.sort({ "earthquakes.date": "desc" })
		.limit(30)
		.exec();

	var evs = [];
	var asea = false;

	for (var i = 0; i < mevents.length && evs.length < 4; i++) {
		if (asea && mevents[i].issea || !asea && mevents[i].issea && mevents[i].maxmagnitude < 7.0)
			continue;

		evs.push(mevents[i]);
		if (mevents[i].issea)
			asea = true;
	}

	if (req.username === null) {
		res.status(200);
		return res.json({ main: evs, closetome: [] });
	}

	let user = await User.getByUsername(req.username, 'location');

	if (user === null || user.isBanned()) {
		res.status(200);
		return res.json({ main: mevents, closetome: [] });
	}

	let cevents = await Event.find({
		epicenter: {
			$near: {
				$maxDistance: 100000000,
				$geometry: { type: 'Point', coordinates: [user.location.coordinates[0], user.location.coordinates[1]] }
			}
		}
	}).sort({ startdate: 'desc' }).limit(30).exec();

	res.status(200);
	return res.json({ closetome: cevents.filter((i) => { return !i.issea; }), main: mevents });
	*/
}



/* GET api/event/:id */
export async function getByID(req: Request, res: Response) {
	const event = await Event.findOne({ _id: req.params.id, visible: true }, '-affectedusers').exec();
	if (event === null)
		return error.response(res, 'E2');

	res.status(200);
	res.json(event);
}
