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

import { AdminBulkMail } from "./mailtool.model";
import { UserModel } from "../user/user.model";
import conf = require('../../conf');
import log = require('../../log');
import mailHelper = require('../../helpers/mail');
import { AdminMailToolConfig, AdminMailToolModule } from ".";
import { getModuleConfiguration } from "../module";

let activeSending = false;

export async function sendPending () {
	if (activeSending)
		return;

	activeSending = true;
	const moduleConfig = getModuleConfiguration(AdminMailToolModule) as AdminMailToolConfig;
	const bm = await AdminBulkMail.findOne({ status: 'sending' }).exec();

	if (bm === null)
		return;

	/* Send n mail at time */
	let i = 0;
	let u = bm.users.pop();
	while (i < moduleConfig.bucketSize && u) {
		bm.doneusers.push(u);

		/* Get their email */
		const user = await UserModel.getByUsername(u, 'email');

		/* Send email */
		if (conf.env === 'mainnet') {
			try {
				if (user.email.indexOf('@unknown') == -1)
					await mailHelper.send(user.email, bm.subject, bm.message);
			} catch(e) {
				log.debug('mail', 'Failed to send to ' + user.email);
			}
		}
        
		u = bm.users.pop();
		i++;
	}

	/* Check if send is complete */
	if (bm.users.length === 0)
		bm.status = 'sent';

	/* Save the bms */
	await bm.save();
	activeSending = false;
}
