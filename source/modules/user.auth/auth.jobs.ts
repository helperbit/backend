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

import { User } from "../user/user.model";
import log = require('../../log');
import { Async } from "../../helpers/async";
import notificationController = require('../notification/notification.controller');
import moment = require('moment');
import telegramHelper = require('../../helpers/telegram');

const moduleName = 'user.auth';

export async function checkAccountsNotActivated() {
	/* Send a reminder to not yet activated accounts after 1 month */
	let users = await User.find({
		"activation.status": false,
		"activation.reminder": null,
		"socialauth.status": 'none',
		regdate: { $lt: moment().subtract(1, 'month').toDate() }
	}).exec();

	/* Disable removing of microsoft based emails */
	users = users.filter(user => user.email.indexOf('microsoft') == -1 && user.email.indexOf('outlook') == -1 && user.email.indexOf('hotmail') == -1);

	if (users.length > 0)
		log.job.debug(moduleName, `Sending a signup reminder to ${users.length} not active users after 1 month`);

	await Async.forEach(users, async user => {
		await notificationController.notify({
			user: user,
			code: 'activateAccount',
			email: true,
			platform: false,
			redirect: `?token=${user.activation.token}&email=${user.email}`
		});

		user.activation.reminder = new Date();
		await user.save();
		log.job.info(moduleName, `Sent a reminder to user: ${user.username} (not actived after 1 month)`);
		telegramHelper.notify(`Sent a reminder to user: ${user.username} (not actived after 1 month)`);
	});

	/* Remove accounts not activated after 1 month from the reminder */
	users = await User.find({
		"activation.status": false,
		"socialauth.status": 'none',
		$and: [
			{ "activation.reminder": { $ne: null } },
			{ "activation.reminder": { $lt: moment().subtract(1, 'month') } }
		]
	}).exec();

	/* Disable removing of microsoft based emails */
	users = users.filter(user => user.email.indexOf('microsoft') == -1 && user.email.indexOf('outlook') == -1 && user.email.indexOf('hotmail') == -1);

	if (users.length > 0)
		log.job.debug(moduleName, `Removing ${users.length} not active users after 2 month`);

	/* Removed expired users */
	await Async.forEach(users, async user => {
		await User.remove({ username: user.username });
		log.job.info(moduleName, `Removed user: ${user.username} (not actived after 2 month)`);
		telegramHelper.notify(`Removed user: ${user.username} (not actived after 2 month)`);
	});
}
