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
import { Campaign } from "./campaign.model";
import moment = require('moment');
import log = require('../../log');
import notificationController = require('../notification/notification.controller');

const moduleName = 'campaign';

export async function concludedCheck(){
	const campaigns = await Campaign.find({ status: 'started', 'end': { $lt: moment().toDate() } }).exec();

	if (campaigns == null)
		return;

	log.job.debug(moduleName, `Checking ${campaigns.length} campaigns for conclusion`);

	for (let i = 0; i < campaigns.length; i++) {
		const d = campaigns[i];

		try {
			d.status = 'concluded';
			await d.save();
			log.job.debug(moduleName, `Setting ${d._id} as concluded`, { telegram: true });

			await notificationController.notify({
				user: d.owner,
				email: true,
				code: 'campaignExpired',
				data: {},
				redirect: d._id
			});
		} catch (err) {
		}
	}
}


export async function birthdayCheck (){
	const trigger = moment().add(1, 'weeks');
	let users = await User.find({ birthdate: { $ne: null }, usertype: 'singleuser' }, 'email username birthdate usertype').exec();
	users = users.filter(u => {
		const d = moment(u.birthdate).year(trigger.year());
		if (d < trigger && d > moment())
			return true;
		else
			return false;
	});
	log.job.debug(moduleName, `Checking ${users.length} users with incoming birthday`);

	for(let i = 0; i < users.length; i++) {
		const u = users[i];
		if (! (await notificationController.hasNotification(u.username, 'campaignBirthday', moment().subtract(1, 'weeks').toDate()))) {
			log.job.debug(moduleName, `Sending to ${u.username} a notification for its incoming birthday`, { telegram: true });

			await notificationController.notify({
				user: u,
				email: true,
				code: 'campaignBirthday'
			});
		}
	}
}

