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
import { AdminMetrics } from "../metrics.model";
import { User } from "../../user/user.model";
import { Statistics } from "../../statistics/statistics.model";
import { BackofficeMetric } from "../../module";
import { Async } from "../../../helpers/async";
import moment = require('moment');
import randomColor = require('randomcolor');
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
import {checkLogin } from '../../admin/auth';
import { ModuleRepository } from "../..";
const country3char = require('../../../data/country3char.json');

const colorsOfCategories = {
	'User': 'blue',
	'Donation': 'orange',
	'User Verification': 'green',
	'Wallet': 'red',
	'Badge': 'random',
	'Financial': 'yellow',
	'Other': 'random'
};


const metrics: BackofficeMetric[] = [ ];
let metricsDict;
let categories;

export function initMetrics() {
	ModuleRepository.i().list().forEach(m => {
		if (!('metrics' in m))
			return;

		m.metrics.forEach(me => {
			metrics.push(me);
		});
	});

	/* Create metric dict */
	metricsDict = metrics.reduce((obj, item) => {
		obj[item.code] = item;
		return obj;
	}, {});

	/* Create categories dict */
	categories = metrics.reduce((obj, item) => {
		if (obj.indexOf(item.ui.category) == -1)
			obj.push(item.ui.category);
		return obj;
	}, []);

	/* Assign random color to metrics */
	metrics.forEach(m => {
		if ('color' in m.ui) return;

		const colorConf: { luminosity: 'dark'; hue?: string } = { luminosity: 'dark' };

		if (m.ui.category in colorsOfCategories) {
			colorConf['hue'] = colorsOfCategories[m.ui.category];
		}

		m.ui.color = randomColor(colorConf);
	});
}

const router = require('express').Router();

/** Return the total of the metric */
async function getTotal(code: string) {
	const metric = metricsDict[code];
	const value = await metric.total();
	return {
		code: metric.code,
		ui: metric.ui,
		total: value
	};
}

router.get('/', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	const mmetrics = await Async.map(metrics, async (m) => await getTotal(m.code));

	const cstats = (await Statistics.find({}).exec()).filter(c => c.country != 'WRL');
	const geolocalized = { map: {}, total: 0, average: 0, fillpercentage: 0 };
	geolocalized.total = await User.countDocuments({ 'location.coordinates': { $ne: [] } }).exec();
	geolocalized.average = Math.floor(cstats.reduce((ac, cv) => ac + cv.users, 0) / cstats.length * 100) / 100;
	geolocalized.fillpercentage = Math.floor(100 * cstats.filter(c => c.users > 0).length / cstats.length * 100) / 100;
	for (let i = 0; i < cstats.length; i++) {
		const c = cstats[i];
		if (c.country in country3char) {
			geolocalized.map[country3char[c.country]] = c.users;
		}
	}

	res.render('admin.metrics/admin/index', { page: 'index', categories: categories, metrics: mmetrics, geolocalized: geolocalized });
}));

/** Index of metrics */
router.get('/metrics', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	const mmetrics = await Async.map(metrics, async (m) => await getTotal(m.code));
	res.render('admin.metrics/admin/metrics', { page: 'metrics', categories: categories, metrics: mmetrics });
}));


/** Manual metrics */
router.get('/metrics/manual', checkLogin, Async.middleware(async (req: AdminPaginateRequest, res: Response) => {
	const query = AdminMetrics.find({}).sort({ time: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('admin.metrics/admin/manual', { page: 'metrics', pagination: data.pagination, manual: data.results });
}));

router.post('/metrics/manual/:date/create', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	const date = req.params.date;

	if (await AdminMetrics.findOne({ time: date }) != null) {
		res.status(500);
		return res.json({ error: 'Already present' });
	} else if (moment(date, ['YYYY-MM-DD'], true) >= moment()) {
		res.status(500);
		return res.json({ error: 'New row should be in the past' });
	}

	const newm = new AdminMetrics();
	newm.time = date;
	newm.date = moment(date, ['YYYY-MM-DD'], true).add(1, 'minutes').toDate();
	await newm.save();
	res.status(200);
	res.json({});
}));

router.post('/metrics/manual/:date/edit', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	const date = req.params.date;

	const toedit = await AdminMetrics.findOne({ time: date }).exec();
	if (toedit == null) {
		res.status(500);
		res.json({});
	}

	if (req.body.field.indexOf('.') != -1)
		toedit[req.body.field.split('.')[0]][req.body.field.split('.')[1]] = parseInt(req.body.value);
	else
		toedit[req.body.field] = parseInt(req.body.value);

	await toedit.save();
	res.status(200);
	res.json({});
}));

router.get('/metrics/total/:code', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	res.status(200);
	res.json(await getTotal(req.params.code));
}));


router.get('/metrics/totals', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	const mres = await Async.map(metrics, async (m) => await getTotal(m.code));

	res.status(200);
	res.json({ totals: mres });
}));


router.post('/metrics/totals', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	const mcodes = req.body.metrics;
	const mres = await Async.map(mcodes, async (m: string) => await getTotal(m));

	res.status(200);
	res.json({ totals: mres });
}));



/** Return the chart data of the metric */
async function getChart (code: string, timeframe: string, start: string, end: string) {
	const metric = metricsDict[code];
	return {
		code: metric.code,
		ui: metric.ui,
		chart: await metric.chart(timeframe, moment(start, ['YYYY-MM-DD'], true).toDate(), moment(end, ['YYYY-MM-DD'], true).toDate())
	};
}


router.get('/metrics/chart/:code/:timeframe/:start/:end', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	res.status(200);
	res.json(await getChart(req.params.code, req.params.timeframe, req.params.start, req.params.end));
}));


router.post('/metrics/charts/:timeframe/:start/:end', checkLogin, Async.middleware(async (req: Request, res: Response) => {
	const mcodes = req.body.metrics;
	const mres = await Async.map(mcodes, async (c: string) => await getChart(c, req.params.timeframe, req.params.start, req.params.end));

	res.status(200);
	res.json({ charts: mres });
}));


export const AdminMetricsApi = router;
