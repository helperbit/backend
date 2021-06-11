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
import { LightningInvoice } from "../invoice.model";
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
import { checkLogin } from '../../admin/auth';
const router = require('express').Router();

router.get('/lightning/invoices', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	let qq = req.query;
	if (!('by' in qq))
		qq = { sort: 'desc', by: 'created_at' };

	const query = LightningInvoice.find({});
	const data = await adminQueryPaginate(query, qq);
	res.render('lightning/admin/list', { page: 'lightning', invoices: data.results, pagination: data.pagination });
});


export const LightningAdminApi = router;
