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
import { Blockchain } from "../../blockchain";
import badgeController = require('./badge.controller');

const moduleName = 'user.badge';
let runningBadgeUpdater = false;

export async function checkMissingBadges() {
	if (runningBadgeUpdater)
		return;

	runningBadgeUpdater = true;
	const users = await User.find({ usertype: "singleuser" }, 'username regdate').sort({ regdate: 'desc' }).exec();
	let n = 0;

	const prices = await Blockchain.getPrices();

	log.job.debug(moduleName, `Checking missing badges for ${users.length} users`);
	for (let i = 0; i < users.length; i++) {
		if (await badgeController.updateUserBadges(users[i].username, prices))
			n += 1;
	}

	log.job.debug(moduleName, `Updated badges for ${n} users`);
	runningBadgeUpdater = false;
}
