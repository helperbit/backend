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
import { Wallet } from "../wallet/wallet.model";
import { UserModel, User } from "../user/user.model";
import error = require('../../error');
import notificationController = require('../notification/notification.controller');
import telegramHelper = require('../../helpers/telegram');


export async function getAdmins(req: any, res: Response) {
	const users = await User.find({ email: { $in: req.user.admins } }, 'username email trustlevel').exec();

	res.status(200);
	res.json({
		adminsusers: users,
		admins: req.user.admins,
		allowedadmins: req.user.allowedadmins
	});
}


export async function addAdmin(req: any, res: Response) {
	req.body.email = req.body.email.toLowerCase();

	const npo = await UserModel.getByUsername(req.username, 'allowedadmins');
	if (npo.allowedadmins.indexOf(req.body.email) == -1)
		return error.response(res, 'EA4');

	const user = await UserModel.getByEmail(req.body.email);
	if (user === null)
		return error.response(res, 'E2');

	if (user.isBanned())
		return error.response(res, 'E');

	if (user.username == req.username)
		return error.response(res, 'E');

	if (!user.activation)
		return error.response(res, 'EA3');

	if (req.user.admins.indexOf(user.email) == -1) {
		req.user.admins.push(user.email);
		req.user.save();

		user.adminof.push(req.user.username);
		user.save();
	}

	await notificationController.notify({
		user: user,
		code: 'becomeAdmin',
		email: true,
		data: { user: req.user.username, fullname: req.user.fullname },
		redirect: '' + req.user.username
	});

	res.status(200);
	res.json({});

	telegramHelper.notify(`User: ${req.user.username} add ${user.username} as admin`);
}


export async function removeAdmin(req: any, res: Response) {
	/* If the admin belong to a wallet, don't remove */
	const wallets = await Wallet.find({ owner: req.username, ismultisig: true, 'multisig.admins': req.body.email }).exec();
	if (wallets.length > 0)
		return error.response(res, 'EW13');

	const user = await UserModel.getByEmail(req.body.email);

	if (req.user.admins.indexOf(req.body.email) != -1) {
		req.user.admins.splice(req.user.admins.indexOf(req.body.email), 1);
		req.user.save();
	}

	if (user.adminof.indexOf(req.user.username) != -1) {
		user.adminof = user.adminof.splice(user.adminof.indexOf(req.user.username), 1);
		user.save();
	}

	res.status(200);
	res.json({});

	await notificationController.notify({
		user: user,
		code: 'removedAdmin',
		email: true,
		data: { user: req.user.username, fullname: req.user.fullname },
		redirect: '' + req.user.username
	});

	telegramHelper.notify(`User: ${req.user.username} removed ${user.username} from admin`);
}
