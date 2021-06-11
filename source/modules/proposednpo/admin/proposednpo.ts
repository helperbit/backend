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
import AdminLogController = require('../../admin.log/log.controller');
import badgeController = require('../../user.badge/badge.controller');
import {checkLogin, checkAuth } from '../../admin/auth';
import { $ProposedNPODocument, ProposedNPOModel, ProposedNPO } from '../proposednpo.model';
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";

const countries = require('../../../data/country.json');
const router = require('express').Router();

router.get('/proposednpo', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = ProposedNPO.find({}, 'name link reporter time endorsment verified country').sort({ time: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('proposednpo/admin/list', { page: 'proposednpo', proposednpo: data.results, pagination: data.pagination });
});

router.get('/proposednpo/:id/', checkLogin, async (req: Request, res: Response) => {
	const data = await ProposedNPOModel.getByID(req.params.id, 'name link reporter time endorsment verified country social');
	if (data === null)
		return res.redirect('/proposednpo');

	res.render('proposednpo/admin/detail', { page: 'proposednpo', proposednpo: data, countries: countries });
});

router.get('/proposednpo/:id/change', checkAuth('operator'), async (req: Request, res: Response) => {
	const data: $ProposedNPODocument = await ProposedNPOModel.getByID(req.params.id, 'name verified');
	if (data === null)
		return res.redirect('/admin/proposednpo');

	data.verified = !data.verified;
	await data.save();
	AdminLogController.operation(req, 'ProposedNPO', `Change state for ${data.name}: ${JSON.stringify(data.verified)}`);
	res.redirect('/admin/proposednpo');

	if (data.verified)
		await badgeController.updateUserBadges(data.reporter);
});


router.post('/proposednpo/:id/edit', checkAuth('operator'), async (req: Request, res: Response) => {
	const id = req.params.id;

	try {
		await ProposedNPO.updateOne({ _id: req.params.id }, { $set: req.body }).exec();
		res.status(200);
		res.json({});
		AdminLogController.operation(req, 'ProposedNPO', `Edited ${id}`);
	} catch (err) {
		res.status(500);
		res.json({ error: 'E', message: err });
	}
});


export const ProposedNPOAdminApi = router;
