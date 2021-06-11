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
import { UserModel } from "../../user/user.model";
import { AdminMerchandise } from "../merchandise.model";
import AdminLogController = require('../../admin.log/log.controller');
import {checkLogin } from '../../admin/auth';
const router = require('express').Router();


router.get('/ambassadors/rank/:timeframe', checkLogin, async (req: Request, res: Response) => {
	const topambassadors = await UserModel.ambassadorRanks({ timeframe: req.params.timeframe, unverified: true });

	res.render('user.ambassador/admin/rank', {
		page: 'ambassador',
		title: 'Rank ' + req.params.timeframe,
		users: topambassadors.map(ta => ({ user: ta._id, count: ta.count, countver: ta.countver }))
	});
});


router.get('/ambassadors/merchandise', checkLogin, async (req: Request, res: Response) => {
	const mdise = await AdminMerchandise.find({}).sort({ minrefs: 'asc' }).exec();

	res.render('user.ambassador/admin/merchandise', {
		page: 'ambassador',
		merchandise: mdise
	});
});


router.post('/ambassadors/merchandise/:mname/:user/edit', checkLogin, async (req: Request, res: Response) => {
	const mdise = await AdminMerchandise.findOne({ name: req.params.mname }).exec();

	for (let i = 0; i < mdise.assignments.length; i++) {
		if (mdise.assignments[i].username == req.params.user) {
			mdise.assignments[i].notes = req.body.notes;
			mdise.assignments[i].status = req.body.status;
		}
	}

	AdminLogController.operation(req, 'Merchandise', `Updating assignment status for ${req.params.mname} for user ${req.params.user} status "${req.body.status}" (Notes: "${req.body.notes}")`, req.params.user);

	await mdise.save();

	res.json({});
	res.status(200);
});

export const UserAmbassadorAdminApi = router;
