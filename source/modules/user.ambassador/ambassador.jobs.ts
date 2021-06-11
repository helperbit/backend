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

import log = require('../../log');
import notificationController = require('../notification/notification.controller');
import mailHelper = require('../../helpers/mail');
import { Async } from "../../helpers/async";
import { $AdminMerchandiseDocument, AdminMerchandise } from './merchandise.model';
import { UserModel, User } from '../user/user.model';

const moduleName = 'user.ambassador';

export async function checkAmbassadorMerchandiseAssigments() {
	log.job.debug(moduleName, 'Checking merchandise assignments');
	const mdises: $AdminMerchandiseDocument[] = await AdminMerchandise.find({}).exec();
	const topambassadors = (await UserModel.ambassadorRanks()).map(ta => ({ username: ta._id, count: ta.count }));

	await Async.forEach(mdises, async (mdise) => {
		if (mdise.assigned == mdise.total)
			return;

		const mu = topambassadors.filter(a => a.count >= mdise.minrefs);

		await Async.forEach(mu, async (famb: any) => {
			const user = await User.findOne({ username: famb.username }, 'username email usertype').exec();

			if (user == null || user.usertype != 'singleuser')
				return;

			if (mdise.assignments.filter(a => a.username == famb.username).length == 0) {
				mdise.assigned += 1;
				mdise.assignments.push({ username: famb.username });
				await mdise.save();

				const ntext = `Assigned the merchandise ${mdise.name} to ${famb.username} for bringing ${mdise.minrefs} verified users`;
				mailHelper.send('info@helperbit.com', `[Ambassador] New merchandise assigned`, ntext);
				log.job.debug(moduleName, ntext, { telegram: true });

				await notificationController.notify({
					user: user,
					code: 'ambassadorMerchandiseAssigment',
					data: { name: mdise.name, minrefs: mdise.minrefs },
					email: true,
					platform: true
				});
			}
		});
	});
};

