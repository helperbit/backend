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
import { Ror } from "../ror.model";
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
import {checkLogin } from '../../admin/auth';
const router = require('express').Router();

router.get('/rors', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = Ror.find({}).sort({});
	const data = await adminQueryPaginate(query, req.query);
	res.render('ror/admin/list', { page: 'ror', rors: data.results, pagination: data.pagination });
});


export const RorAdminApi = router;
