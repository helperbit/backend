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

import { User } from "./user.model";
import log = require('../../log');
import { Async } from "../../helpers/async";

const moduleName = 'user';

export async function checkPremiumExpiration() {
	log.job.debug(moduleName, 'Checking premium expiration');
	const users = await User.find({ 'premium.enabled': true, 'premium.expiration': { $lt: Date() } }, 'premium username').exec();
	Async.forEach(users, async (user) => {
		user.premium.enabled = false;
		await user.save();
		log.job.debug(moduleName, `Premium for user ${user.username} expired`, { telegram: true });
	});
}
