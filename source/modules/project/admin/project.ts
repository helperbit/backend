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
import notificationController = require('../../notification/notification.controller');
import AdminLogController = require('../../admin.log/log.controller');
import {checkLogin, checkAuth } from '../../admin/auth';
import { User } from "../../user/user.model";
import { Project, ProjectModel, $ProjectDocument } from "../project.model";
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";

const router = require('express').Router();

router.get('/projects/bystatus/:status', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Project.find({ status: req.params.status }).sort({ start: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('project/admin/list', { page: 'project', projects: data.results, pagination: data.pagination, title: `By status: ${req.params.status}` });
});

router.get('/projects', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Project.find({}).sort({ start: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('project/admin/list', { page: 'project', projects: data.results, pagination: data.pagination, title: 'All' });
});

router.get('/project/:id', checkLogin, async (req: Request, res: Response) => {
	const project = await ProjectModel.getByID(req.params.id);
	const user = await User.findOne ({username: project.owner}, 'admins username email usertype').exec();
	const admins = await User.find({email: {$in:user.admins}}, 'trustlevel email username').exec();

	if (project === null)
		res.redirect('/admin/projects');
	else {
		res.render('project/admin/detail', { page: 'project', project: project, user: user, admins: admins });
	}
});


router.post('/project/:id/supporter/add', checkAuth('operator'), async (req: Request, res: Response) => {
	const p: $ProjectDocument = await ProjectModel.getByID(req.params.id);

	if(! ('supporters' in p))
		(p as any).supporters = [];

	if((await User.findOne({username: req.body.user})) == null){
		res.status(500);
		return res.json({ error: 'User does not exist' });
	}

	if (p.supporters.filter(s => s.user == req.body.user).length > 0) {
		res.status(500);
		return res.json({ error: 'Supporter already present' });
	}

	p.supporters.push({
		user: req.body.user,
		link: req.body.link,
		level: req.body.level
	});
	p.markModified('supporters');
	await p.save();

	res.status(200);
	res.json({});
});


router.post('/project/:id/supporter/remove', checkAuth('operator'), async (req: Request, res: Response) => {
	const p: $ProjectDocument = await ProjectModel.getByID(req.params.id);

	p.supporters = p.supporters.filter(s => s.user != req.body.user);
	p.markModified('supporters');
	await p.save();

	res.status(200);
	res.json({});
});



router.post('/project/:id/remove', checkAuth('admin'), async (req: Request, res: Response) => {
	await Project.remove({ _id: req.params.id }).exec();
	res.status(200);
	res.json({});
	AdminLogController.operation(req, 'Project', `Project removed: ${req.params.id}`);
});


router.get('/project/:id/approve', checkAuth('operator'), async (req: Request, res: Response) => {
	const p = await ProjectModel.getByID(req.params.id);
	p.status = 'approved';
	await p.save();
	await notificationController.notify({
		user: p.owner,
		email: true,
		code: 'projectApproved',
		redirect: req.params.id,
		data: {
			title: p.title.en
		}
	});

	AdminLogController.operation(req, 'Project', `Project approved: ${req.params.id}`, p.owner);
	res.redirect(`/admin/project/${req.params.id}`);
});

router.get('/project/:id/reject', checkAuth('operator'), async (req: Request, res: Response) => {
	const p = await ProjectModel.getByID(req.params.id);
	p.status = 'rejected';
	await p.save();
	await notificationController.notify({
		user: p.owner,
		email: true,
		code: 'projectRejected',
		data: {
			title: p.title.en
		}
	});

	AdminLogController.operation(req, 'Project', `Project rejected: ${req.params.id}`, p.owner);
	res.redirect(`/admin/project/${req.params.id}`);
});


router.get('/project/:id/end', checkAuth('operator'), async (req: Request, res: Response) => {
	const p = await ProjectModel.getByID(req.params.id);
	p.end = new Date();
	await p.save();
	res.redirect(`/admin/project/${req.params.id}`);
});


export const ProjectAdminApi = router;
