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
import { Media } from "../media.model";
import AdminLogController = require('../../admin.log/log.controller');
import mediaController = require('../media.controller');
import {checkLogin, checkAuth } from '../../admin/auth';
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";

const router = require('express').Router();

router.get('/media/:id', (req: Request, res: Response) => {
	mediaController.showAdmin(req, res);
});

router.get('/medias/:container', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Media.find({ container: req.params.container }, '+archivedate +archiveby').sort({ creationdate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('media/admin/list', { page: 'media', medias: data.results, pagination: data.pagination, title: 'Container: ' + req.params.container });
});

router.get('/medias', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Media.find({}, '+archivedate +archiveby').sort({ creationdate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('media/admin/list', { page: 'media', medias: data.results, pagination: data.pagination, title: 'All' });
});

router.post('/medias/:id/archive', checkAuth('kyc'), async (req: any, res: Response) => {
	try {
		await mediaController.archiveDocument(req.params.id, req.session.user);
		AdminLogController.operation(req, 'Media', `Media ${req.params.id} archived`);
	} catch (err) { }
	finally {
		res.status(200);
		res.json({});
	}
});

export = router;
