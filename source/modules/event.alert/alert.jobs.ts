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

import moment = require('moment');
import log = require('../../log');
import mediaController = require('../media/media.controller');
import { $AlertDocument, Alert } from './alert.model';
import { getModuleConfiguration } from '../module';
import { EventAlertModule, EventAlertConfig } from '.';

const moduleName = 'event.alert';


// function generateFakeAlerts(n: number) {
// 	const generateRandomAlert = (base: number[], basetype: string) => {
// 		const al: $AlertDocument = new Alert();
// 		al.user = 'pinco' + Math.random();
// 		al.type = basetype;
// 		al.position = { type: 'Point', coordinates: [base[0] + (Math.random() - 0.1), base[1] + (Math.random() - 0.1)] };
// 		al.weight = Math.random();
// 		al.save();
// 	};

// 	for (let i = 0; i < n; i++)
// 		generateRandomAlert([9.2468, 39.2308], 'wildfire');
// }


export async function cleanPast () {
	const moduleConfig = getModuleConfiguration(EventAlertModule) as EventAlertConfig;
	
	const datespan = new Date(Date.parse(moment().subtract(moduleConfig.expiration, 'week').format()));
	const alerts: $AlertDocument[] = await Alert.find({ time: { $lt: datespan }, media: { $ne: null } }).exec();

	log.job.debug(moduleName, `Cleaning old ${alerts.length} alerts...`);

	for (let i = 0; i < alerts.length; i++) {
		const alert = alerts[i];
		if (alert.media)
			await mediaController.removeMedia(alert.media as any)

		alert.media = null;
		alert.save();
	}
}
