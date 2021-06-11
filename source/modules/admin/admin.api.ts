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

import { Response, Request } from "express";
import { AdminUser } from "../admin.user/user.model";
import express = require('express');
import u2f = require('u2f');
import conf = require('../../conf');
import AdminLogController = require('../admin.log/log.controller');
import error = require('../../error');
import { checkLogin } from './auth';

const router = express.Router();

router.get('/unauthorized', (req: Request, res: Response) => {
	res.render('admin/views/unauthorized', {});
});

router.get('/login', (req: Request, res: Response) => {
	res.render('admin/views/login', { u2f: conf.backoffice.u2f.enable });
});

router.get('/logout', checkLogin, (req: any, res: Response) => {
	req.session.admin = false;
	req.session.privileges = [];
	AdminLogController.logout(req);
	res.redirect('/admin/login');
});


router.get('/u2freg', (req: any, res: Response) => {
	const registrationRequest = u2f.request(conf.backoffice.u2f.appId);
	req.session.registrationRequest = registrationRequest;
	res.render('admin/views/u2freg', { reg: registrationRequest });
});

router.post('/u2freg', (req: any, res: Response) => {
	const result = u2f.checkRegistration(req.session.registrationRequest, req.body);
	if (result.successful) {
		res.status(200);
		res.json({ publicKey: result.publicKey, keyHandle: result.keyHandle });
	} else {
		res.status(500);
		res.json({});
	}
});

router.post('/login', async (req: any, res: Response) => {
	const user = await AdminUser.findOne({ username: req.body.user }, 'username +password iphistory lastip keyhandle privileges').exec();
	req.session.user = req.body.user;

	if (user != null && (await user.verifyPassword(req.body.password))) {
		req.session.privileges = user.privileges;

		if (conf.backoffice.u2f.enable) {
			const authRequest = u2f.request(conf.backoffice.u2f.appId, user.keyhandle);
			req.session.authRequest = authRequest;

			req.session.admin = false;
			res.status(200);
			res.json(authRequest);
		} else {
			req.session.admin = true;
			await AdminLogController.login(req);

			res.status(200);
			res.json({});

			/* Save lastlogin info */
			user.lastlogin = new Date();
			user.lastip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

			if (user.iphistory.length == 0 || user.iphistory[user.iphistory.length - 1] != user.lastip)
				user.iphistory.push(user.lastip);
			await user.save();
		}
	} else {
		error.response(res, 'E6');
		await AdminLogController.loginfail(req);
	}
});

router.post('/login/u2f', async (req: any, res: Response) => {
	const user = await AdminUser.findOne({ username: req.session.user }, 'username iphistory lastip publickey').exec();

	if (!user)
		return error.response(res, 'E6');

	const result = u2f.checkSignature(req.session.authRequest, req.body, user.publickey);

	if (result.successful) {
		req.session.admin = true;
		res.status(200);
		res.json({});
		await AdminLogController.login(req);

		/* Save lastlogin info */
		user.lastlogin = new Date();
		user.lastip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

		if (user.iphistory.length == 0 || user.iphistory[user.iphistory.length - 1] != user.lastip)
			user.iphistory.push(user.lastip);
		await user.save();
	} else {
		res.status(401);
		res.json({});
		await AdminLogController.loginfailu2f(req);
	}
});


export const AdminApi = router;
