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
import error = require('../../error');
import { Async } from "../../helpers/async";
import telegramHelper = require('../../helpers/telegram');
import { Blockchain } from "../../blockchain";
import schemaValidator = require('../../helpers/schema-validator');
import mediaController = require('../media/media.controller');
import { $ProjectDocument, Project, ProjectModel } from './project.model';
import { WalletModel } from "../wallet/wallet.model";
import { UserModel } from "../user/user.model";
import { Donation } from "../donation/donation.model";
import { EventModel } from "../event/event.model";
import { QueryHelper } from "../../helpers/query";
import { tokenize } from "../../helpers/crypto";

/** Middleware per ottenere un progetto ownato dall'utente */
export async function get(req: any, res: Response, next: NextFunction) {
	const project = await Project.findOne({ _id: req.params.id, owner: req.username }).exec();
	if (project === null)
		return error.response(res, 'E2');

	req.project = project;
	next();
};


/* GET api/projects/main */
export async function getMainList(req: Request, res: Response) {
	/* Latest projects */
	const latestprojects = await Project.find({
		status: 'approved',
		media: { $ne: null },
		end: null
	}).sort({ start: 'desc' }).limit(4).exec();

	/* Trending projects */
	const trendingprojects = [];
	const ids = latestprojects.map(p => String(p._id));
	const idsFilter = (p => ids.indexOf(String(p._id)) == -1);

	// 1: highest volume
	const hvol = (await Project.find({
		status: 'approved',
		media: { $ne: null },
		end: null
	}).sort({ received: 'desc' }).limit(32).exec()).filter(idsFilter);

	if (hvol.length > 0) {
		const np = hvol[0];
		trendingprojects.push(np);
		ids.push(String(np._id));
	}

	// 2: highest donations number
	const hdon = (await Project.find({
		status: 'approved',
		media: { $ne: null },
		end: null
	}).sort({ receiveddonations: 'desc' }).limit(32).exec()).filter(idsFilter);

	if (hdon.length > 0) {
		const np = hdon[0];
		trendingprojects.push(np);
		ids.push(String(np._id));
	}

	// 3: latest donation
	const ldon = (await Donation.find({
		'to.project': { $ne: null }
	}, 'to.project').sort({ time: 'desc' }).limit(48).exec()).map(d => {
		for (let i = 0; i < d.to.length; i++) {
			if (d.to[i].project)
				return d.to[i].project;
		}
		return null;
	}).filter(p => p != null);
	const pldon = (await Project.find({ _id: { $in: ldon } }).exec()).filter(idsFilter);

	if (pldon.length > 0) {
		const np = pldon[0];
		trendingprojects.push(np);
		ids.push(String(np._id));
	}

	// 4: random
	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
	}

	const prand = (await Project.find({
		status: 'approved',
		media: { $ne: null },
		end: null
	}).limit(32).exec()).filter(idsFilter);
	shuffleArray(prand);

	for (let i = 0; trendingprojects.length < 4 && i < prand.length; i++) {
		const np = prand[i];
		trendingprojects.push(np);
		ids.push(String(np._id));
	}

	res.status(200);
	res.json({ trending: trendingprojects, latest: latestprojects });
};


/* GET /api/project/:id */
export async function getByID(req: any, res: Response) {
	const id = req.params.id;
	const project: $ProjectDocument = await ProjectModel.getByID(id);

	if (project == null)
		return error.response(res, 'E2');

	if (project.status != 'approved' && project.owner != req.username)
		return error.response(res, 'E2')

	if ('receiveaddress' in project && schemaValidator.addressCheck(project.receiveaddress)) {
		res.status(200);
		res.json(project);
	} else {
		const owner = await UserModel.getByUsername(project.owner, 'receiveaddress');

		if (owner !== null && schemaValidator.addressCheck(owner.receiveaddress)) {
			project.set('receiveaddress', owner.receiveaddress, { strict: false });
		}

		res.status(200);
		res.json(project);
	}
};


/* GET /api/user/:name/projects
 * GET /api/projects/list 
 * GET /api/event/:id/projects */
export function getList(type: string) {
	return async (req: any, res: Response) => {
		if (type == 'user' || type == 'me') {
			let name = null;
			if (type == 'user')
				name = req.params.name.toLowerCase();
			else
				name = req.username;

			const query: any = { owner: name };

			if (name != req.username)
				query['status'] = 'approved';

			query['end'] = null;
			const projects = await Project.find(query).sort({ 'start': 'desc' }).exec();

			query['end'] = { $ne: null };
			const closedprojects = await Project.find(query).sort({ 'start': 'desc' }).exec();

			res.status(200);
			res.json({ projects: projects || [], closedprojects: closedprojects || [] });
		} else if (type == 'event') {
			const projects = await QueryHelper.pagination(req, Project, {
				sort: 'desc', orderby: 'start', query: { event: req.params.id }
			});
			res.status(200);
			res.json({ projects: projects });
		} else if (type == 'paginated') {
			let query: any = { status: 'approved' };

			if ('tags' in req.body) {
				query = { status: 'approved', tags: { $in: req.body.tags } };
			}

			if ('title' in req.body) {
				query['$or'] = [
					{ 'title.en': { $regex: new RegExp(req.body.title), $options: 'i' } },
					{ 'title.it': { $regex: new RegExp(req.body.title), $options: 'i' } },
					{ 'title.es': { $regex: new RegExp(req.body.title), $options: 'i' } }
				];
			}

			const projects = await QueryHelper.pagination(req, Project, {
				sort: 'desc',
				orderby: 'start',
				query: query
			});
			const count = await Project.countDocuments(query).exec();
			res.status(200);
			res.json({ projects: projects, count: count });
		} else {
			const projects = await Project.find({}).exec();
			res.status(200);
			res.json({ projects: projects });
		}
	}
}


/* POST api/project/:id/submit */
export async function submit(req: any, res: Response) {
	if (req.project.status != 'draft')
		return error.response(res, 'E');

	req.project.status = 'submitted';

	try {
		await req.project.save();
		telegramHelper.notify(`User ${req.username} submitted the project ${req.project._id}; review required by an admin.`);
		res.status(200);
		res.json({});
	} catch (err) {
		error.response(res, 'E');
	}
};


async function updateProjectMiddle(req: any, res: Response) {
	/* Check if the project is already associated */
	if ('event' in req.body && req.body.event !== null) {
		const otherproj = await Project.findOne({ _id: { $ne: req.project._id }, status: 'draft', owner: req.username, event: req.body.event }).exec();

		if (otherproj !== null)
			return Promise.reject('EP2');
	}

	/* Check if the receiveaddress if owned by the user and not used */
	if ('receiveaddress' in req.body) {
		const wallet = await WalletModel.getByOwnerAndAddress(req.username, req.body.receiveaddress);

		if (wallet == null)
			return Promise.reject('EP1');

		/* Check if the user is already using the receiveaddress */
		if ((await Project.find({ _id: { $ne: req.project._id }, owner: req.username, receiveaddress: req.body.receiveaddress, end: null }).exec()).length > 0)
			return Promise.reject('EP1');

		req.project.receiveaddress = req.body.receiveaddress;
	}

	// TODO check if the event is in me/events
	if ('event' in req.body) {
		const event = await EventModel.getByID(req.body.event);

		if (event === null)
			req.body.event = null;
		else
			req.body.countries = event.affectedcountries;
	}

	req.project = req.project.safeUpdate(req.body);
}


/* POST api/project/:id/edit */
export async function update(req: any, res: Response) {
	try {
		await updateProjectMiddle(req, res);

		const changes = QueryHelper.detectChanges(req.project, ['title', 'description', 'target']);
		if (changes != null) {
			if (!req.project.changeHistory)
				req.project.changeHistory = [];
			req.project.changeHistory.push({ content: changes });
			req.project.markModified('changeHistory');
		}

		await req.project.save();
		res.status(200);
		res.json({});
		telegramHelper.notify(`User ${req.username} edited the project ${req.project._id}.`);
	} catch (err) {
		error.response(res, err || 'E');
	}
};


/* POST /api/project/create */
export async function create(req: any, res: Response) {
	/* Check if the receiveaddress if owned by the user */
	const wallet = await WalletModel.getByOwnerAndAddress(req.username, req.body.receiveaddress);
	if (wallet == null)
		return error.response(res, 'EP1');

	/* Check if the user has already > 10 projects */
	if ((await Project.find({ owner: req.username }).exec()).length >= 10)
		return error.response(res, 'E');

	try {
		req.project = new Project();
		req.project.owner = req.user.username;
		await updateProjectMiddle(req, res);

		const changes = QueryHelper.detectChanges(req.project, ['title', 'description', 'target'], true);
		if (changes != null) {
			if (!req.project.changeHistory)
				req.project.changeHistory = [];
			req.project.changeHistory.push({ content: changes });
			req.project.markModified('changeHistory');
		}

		await req.project.save();

		res.status(200);
		res.json({ id: req.project._id });
		telegramHelper.notify(`User ${req.username} created the project ${req.project._id}.`);
	} catch (err) {
		return error.response(res, err || 'E');
	};
};


/* POST api/project/:id/delete */
export async function remove(req: any, res: Response) {
	if (req.project.receiveddonations !== 0)
		return error.response(res, 'EP6');

	await Project.remove({ _id: req.project._id });
	res.status(200);
	res.json({});
	telegramHelper.notify(`User ${req.username} deleted the project ${req.project._id}`);
};


/* POST api/project/:id/media/remove */
export async function removeMedia(req: any, res: Response) {
	const mid = req.params.mid;
	const i = req.project.media.indexOf(mid);

	if (i == -1)
		return error.response(res, 'E');

	req.project.media.splice(i, 1);

	await mediaController.removeMedia(mid);
	await req.project.save();

	res.status(200);
	res.json({});
};


/* POST api/project/:id/media */
export async function uploadMedia(req: any, res: Response) {
	if (req.project.media.length > 8)
		return error.response(res, 'EP8');

	const token = Date() + req.project._id + Math.random();
	const hash = await tokenize(token, false);
	const rim = await mediaController.upload(req, res, {
		maxwidth: 600,
		container: 'project',
		filename: '' + req.project._id + '_' + hash,
		types: ['image']
	});

	req.project.media.push(rim.image._id);
	await req.project.save();
	res.status(200);
	res.json({ id: rim.image._id });
	telegramHelper.notify(`User ${req.username} edited the project ${req.project._id}: new media`);
};


/** ********* Activities */
function getActivityIndex(project, aid: string): number {
	for (let i = 0; i < project.activities.length; i++) {
		if (project.activities[i]._id == aid)
			return i;
	}
	return -1;
}


/* POST /project/:id/activity/new */
export async function newActivity(req: any, res: Response) {
	const newactivity = {
		title: req.body.title,
		// target: req.body.target,
		description: ('description' in req.body) ? req.body.description : null,
		media: [],
		category: req.body.category || 'update'
	};

	req.project.activities.push(newactivity);
	await req.project.save();
	res.status(200);
	res.json({ id: req.project.activities[req.project.activities.length - 1]._id });
	telegramHelper.notify(`User ${req.username} edited the project ${req.project._id}: new activity`);
};


/* POST /project/:id/activity/:aid/edit */
export async function editActivity(req: any, res: Response) {
	const i = getActivityIndex(req.project, req.params.aid)
	if (i < 0) return error.response(res, 'E');

	req.project.activities[i].title = req.body.title;
	// req.project.activities[i].target = req.body.target || 0.0;
	req.project.activities[i].category = req.body.category || 'update';
	if ('description' in req.body)
		req.project.activities[i].description = req.body.description;

	await req.project.save();
	res.status(200);
	res.json({});
};


/* POST /project/:id/activity/:aid/remove */
export async function removeActivity(req: any, res: Response) {
	const i = getActivityIndex(req.project, req.params.aid)
	if (i < 0) return error.response(res, 'E');

	await mediaController.removeMediaList(req.project.activities[i].media);
	req.project.activities.splice(i, 1);

	await req.project.save();
	res.status(200);
	res.json({});
	telegramHelper.notify(`User ${req.username} edited the project ${req.project._id}: removed activity`);
};


/* POST /project/:id/activity/:aid/media */
export async function uploadActivityMedia(req: any, res: Response) {
	const i = getActivityIndex(req.project, req.params.aid)
	if (i < 0) return error.response(res, 'E');

	if (req.project.activities[i].media.length > 4)
		return error.response(res, 'EP8');

	const token = Date() + req.project._id + Math.random();

	const hash = await tokenize(token, false);
	const rim = await mediaController.upload(req, res, {
		maxwidth: 600,
		container: 'project',
		filename: '' + req.project._id + '_' + req.params.aid + '_' + hash,
		types: ['image', 'pdf']
	});

	req.project.activities[i].media.push(rim.image._id);
	await req.project.save();
	res.status(200);
	res.json({ id: rim.image._id });
	telegramHelper.notify(`User ${req.username} edited the project ${req.project._id}: new activity media`);
};


/* POST /project/:id/activity/:aid/media/:mid/remove */
export async function removeActivityMedia(req: any, res: Response) {
	const i = getActivityIndex(req.project, req.params.aid)
	if (i < 0) return error.response(res, 'E');

	const mid = req.params.mid;
	const j = req.project.activities[i].media.indexOf(mid);

	if (j == -1)
		return error.response(res, 'E');

	req.project.activities[i].media.splice(j, 1);

	await mediaController.removeMedia(mid);
	await req.project.save();
	res.status(200);
	res.json({});
};


/* UNUSED POST /project/:id/activity/:aid/media/remove */
export async function removeActivityMedias(req: any, res: Response) {
	const i = getActivityIndex(req.project, req.params.aid)
	if (i < 0) return error.response(res, 'E');

	Async.forEach(req.params.medias, async mid => {
		const j = req.project.activities[i].media.indexOf(mid);

		if (j == -1)
			return;

		req.project.activities[i].media.splice(j, 1);
		await mediaController.removeMedia(mid as any);
	});

	await req.project.save();
	res.status(200);
	res.json({});
};


/** Aggiorna il pending/used di un progetto dato un address / from / value */
export async function updateProjectBalances(address: string, from: string, value: number) {
	// Project.findOne ({owner: d.from, end: null, status: 'approved'}
	const project: $ProjectDocument = await Project.findOne({
		$or: [{ receiveaddress: address }, {
			$and: [
				{ receiveaddress: null },
				{ owner: from }
			],
		}],
		end: null,
		status: 'approved'
	}).exec();

	if (project == null)
		return;

	const p = await Blockchain.getPrices();
	project.used += value * p[project.currency.toLowerCase()];
	project.pending -= value;

	if (project.pending < 0)
		project.pending = 0;

	if (project.end == null && project.target < (project.used + (project.pending * p[project.currency.toLowerCase()])))
		project.end = new Date();

	await project.save();
};
