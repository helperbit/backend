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

import { Response } from "express";
import error = require('../../../error');
import {checkLogin } from '../../admin/auth';
import AdminLogController = require('../../admin.log/log.controller');
import { $AdminUserDocument, AdminUser } from '../user.model';

const router = require('express').Router();


router.get('/adminuser', checkLogin, async (req: any, res: Response) => {
	res.render('admin.user/admin/settings', {
		page: 'AdminUser',
		user: await AdminUser.findOne({username: req.session.user})
	});
});

router.post('/adminuser/changepassword', checkLogin, async (req: any, res: Response) => {
	const oldp: string = req.body.oldpassword;
	const newp: string = req.body.newpassword;
	const user: $AdminUserDocument = await AdminUser.findOne({username: req.session.user}, '+password lastpasswordchange').exec();

	if (! (await user.verifyPassword(oldp)))
		return error.response(res, 'E');

	user.password = req.body.newpassword;
	user.lastpasswordchange = new Date();
	await user.save();
	res.status(200);
	res.json({});
	await AdminLogController.changepassword(req);
});

export const AdminUserApi = router;
