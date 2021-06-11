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
import {checkLogin } from '../../admin/auth';
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
import { TimeLockTransaction } from "../timelocktransaction.model";
const router = require('express').Router();

router.get('/tltransactions/:status', checkLogin, (req: AdminPaginateRequest, res: Response) => {
	const st = req.params.status;
	let q = {};

	switch (st) {
		case 'all':
			q = {};
			break;
		case 'signing':
			q = { status: 'signing' };
			break;
		case 'signed':
			q = { status: 'signed' };
			break;
		case 'creation':
			q = { status: 'creation' };
			break;
	}

	const query = TimeLockTransaction.find(q).sort({ time: 'desc' });
	adminQueryPaginate(query, req.query).then(data => {
		res.render('wallet.verify/admin/list', { page: 'tltransaction', txs: data.results, pagination: data.pagination, title: st });
	});
});


export const VerifyAdminRouter = router;
