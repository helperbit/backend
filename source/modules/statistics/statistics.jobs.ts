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

import moment = require('moment');
import log = require('../../log');
import { Async } from "../../helpers/async";
import { $StatisticsDocument, Statistics } from './statistics.model';
import { User } from '../user/user.model';
import { Donation } from '../donation/donation.model';
import { Project } from '../project/project.model';
import { Event } from '../event/event.model';
import { RedisCache } from '../../helpers/cache';
import statisticsController = require('./statistics.controller');
import { getModuleConfiguration } from '../module';
import { StatisticsConfig, StatisticsModule } from '.';

const moduleName = 'statistics';
const countryList = require('../../data/country.json');
const onlineCache = new RedisCache();

async function updateHistoryObjectStep(stat, y: number, w: number) {
	const start = new Date(Date.parse(moment([y]).week(w).format()));
	const end = new Date(Date.parse(moment([y]).week(w + 1).format()));
	const country = stat.country;
	const current = new Date();

	let qc = country != 'WRL' ? country : { $ne: null };
	let v: {donations: number; donationsvolume: number}[] = await Donation.aggregate()
		.match({ time: { $gt: start, $lt: end }, fromcountry: qc })
		.group({
			_id: null,
			donations: { $sum: 1 },
			donationsvolume: { $sum: "$value" }
		})
		.exec();

	const hstat = { start: start, donated: 0, donateddonations: 0, received: 0, receiveddonations: 0 };

	if (v !== null && v.length !== 0) {
		hstat.donated = v[0].donationsvolume;
		hstat.donateddonations = v[0].donations;
	}

	qc = country != 'WRL' ? country : { $ne: null };
	v = await Donation.aggregate()
		.match({ time: { $gt: start, $lt: end }, tocountry: qc })
		.group({
			_id: null,
			donations: { $sum: 1 },
			donationsvolume: { $sum: "$value" }
		})
		.exec();

	if (v !== null && v.length !== 0) {
		hstat.received = v[0].donationsvolume;
		hstat.receiveddonations = v[0].donations;
	}

	/* If not empty, save! */
	if (('received' in hstat && hstat.received != 0) || ('donated' in hstat && hstat.donated != 0)) {
		stat.history.push(hstat);
	}

	if (w < moment([y]).weeksInYear())
		w++;
	else if (y < current.getFullYear()) {
		y++;
		w = 1;
	} else {
		stat.save();
		return;
	}

	stat.historylast = moment([y]).week(w).format();
	await updateHistoryObjectStep(stat, y, w);
}

async function updateHistoryObject(stat) {
	const moduleConfig = getModuleConfiguration(StatisticsModule) as StatisticsConfig;
	if (stat.historylast !== null &&
		(moment(stat.historylast).year() == moment().year() &&
			moment(stat.historylast).week() == moment().week())) {
		return;
	}

	const country = stat.country;
	const current = new Date();

	if (stat.historylast === null) {
		stat.history = [];
		stat.historylast = new Date(moduleConfig.minYear, 0, 0);
	} else if ((Number(current) - stat.historylast.getTime()) < 518400000) {
		return;
	}

	await updateHistoryObjectStep(stat, stat.historylast.getFullYear(), moment(stat.historylast).week());
	// stat.save ();
}

async function updateCountryStats(stat: $StatisticsDocument) {
	const country = stat.country;
	let q: { username?: any; fromcountry?: any; $and?: any[]; tocountry?: string; country?: string; countries?: string[] } = {};

	try {
		let online = await onlineCache.keys('online_*');
		online = online.map(v => v.split('online_')[1]);

		q = { username: { $in: online } };
		if (country != 'WRL')
			q.country = country;

		stat.onlineusers = await User.countDocuments(q).exec();
	} catch (err) { }

	const promises: Promise<number>[] = [
		User.countDocuments(country != 'WRL' ? { country: country, 'activation.status': true } : { 'activation.status': true }).exec(),
		User.countDocuments(country != 'WRL' ? { country: country, usertype: 'npo', 'activation.status': true } : { usertype: 'npo', 'activation.status': true }).exec(),
		User.countDocuments(country != 'WRL' ? { country: country, usertype: 'company', 'activation.status': true } : { usertype: 'company', 'activation.status': true }).exec(),
		User.countDocuments(country != 'WRL' ? { country: country, usertype: 'singleuser', 'activation.status': true } : { usertype: 'singleuser', 'activation.status': true }).exec(),
		Project.countDocuments(country != 'WRL' ? { countries: country } : {}).exec(),
		Event.countDocuments(country != 'WRL' ? { affectedcountries: country } : {}).exec(),
	];

	const values = await Promise.all(promises);
	stat.users = values[0];
	stat.organizations = values[1];
	stat.companies = values[2];
	stat.singleusers = values[3];
	stat.projects = values[4];
	stat.events = values[5];

	q = country != 'WRL' ? { fromcountry: country } : {};
	let v: {donations: number; donationsvolume: number}[] = await Donation.aggregate()
		.match(q)
		.group({
			_id: null,
			donations: { $sum: 1 },
			donationsvolume: { $sum: "$value" }
		})
		.exec();

	if (v !== null && v.length !== 0) {
		stat.donated = v[0].donationsvolume;
		stat.donateddonations = v[0].donations;
	}

	q = country != 'WRL' ? { tocountry: country } : {};
	v = await Donation.aggregate()
		.match(q)
		.group({
			_id: null,
			donations: { $sum: 1 },
			donationsvolume: { $sum: "$value" }
		})
		.exec();

	if (v !== null && v.length !== 0) {
		stat.received = v[0].donationsvolume;
		stat.receiveddonations = v[0].donations;
	}

	/* Top five */
	q = country != 'WRL' ? { "fromcountry": country } : { "fromcountry": { $ne: null } };
	let v2: {volume: number; _id: string}[] = await Donation.aggregate()
		.match(q)
		.unwind("to")
		.group({
			_id: "$tocountry",
			volume: { $sum: "$to.value" },
		})
		.sort({ volume: 'desc' })
		.limit(5)
		.exec();
	if (v2 !== null && v2.length !== 0) {
		stat.topfivedonated = v2.map(i => ({ country: i._id, volume: i.volume }));
	}
	else
		stat.topfivedonated = [];


	q = country != 'WRL'
		? { $and: [{ "fromcountry": { $ne: null } }, { "tocountry": country }] }
		: { $and: [{ "fromcountry": { $ne: null } }, { "tocountry": { $ne: null } }] };
	v2 = await Donation.aggregate()
		.unwind("to")
		.match(q)
		.group({
			_id: "$fromcountry",
			volume: { $sum: "$to.value" },
		})
		.sort({ volume: 'desc' })
		.limit(5)
		.exec();

	if (v2 !== null && v2.length !== 0) {
		stat.topfivereceived = v2.map(i => ({ country: i._id, volume: i.volume }));
	}
	else
		stat.topfivereceived = [];

	await stat.save();
	await updateHistoryObject(stat);
}


export async function update() {
	log.job.debug(moduleName, 'Updating world and country statistics');

	// TODO temp remove
	// await Statistics.deleteMany({}).exec();

	await Async.forEach (countryList, async (country: string) => {
		let stat = await Statistics.findOne({ country: country }).exec();
		if (stat === null) {
			stat = new Statistics();
			stat.country = country;
			await stat.save();
			await updateCountryStats(stat);
		} else {
			await updateCountryStats(stat);
		}
	});

	let stat = await Statistics.findOne({ country: 'WRL' }).exec();
	if (stat === null) {
		stat = new Statistics();
		stat.country = 'WRL';
		await stat.save();
		await updateCountryStats(stat);
	} else {
		await updateCountryStats(stat);
	}
}


export async function updateSocial() {
	log.job.debug(moduleName, 'Updating social statistics');
	await statisticsController.updateSocial();
}

