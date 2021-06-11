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

import frisby = require('frisby');
import execSync = require('sync-exec');
import common = require('./common');
import { FAUCET_AMOUNT } from './wallet';

export function createProject(data, next) {
	frisby.create('/project/create - create project')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: data.projectTarget || 200,
			currency: 'EUR',
			receiveaddress: data.address
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSONTypes({ id: String })
		.afterJSON(function (json) {
			data.projectid = json.id;
			next(data);
		}).toss();
}

export function submitProject(data, next) {
	frisby.create('/project/:id/submit - submit project')
		.post(`http://localhost:3000/api/v1/project/${data.projectid}/submit`, {}, { json: true })
		.expectStatus(200).expectJSON({})
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON((json) => {
			frisby.create('/me/projects - check submitted status')
				.get(common.api + 'me/projects')
				.expectStatus(200)
				.addHeader('authorization', 'Bearer ' + data.token)
				.expectJSON({ closedprojects: [], projects: [{ status: 'submitted', title: { en: "Mondo" }, description: { en: "Ciao" }, target: v => v > 0, currency: 'EUR' }] })
				.afterJSON(j => next(data))
				.toss();
		})
		.toss();
}

export function estimateProjectTarget(donations: number, currency: string = 'eur') {
	return (data, next) => {
		frisby.create('/info/base - estimate project target')
			.get(`http://localhost:3000/api/v1/info/base`, {}, { json: true })
			.expectStatus(200)
			.afterJSON((json) => {
				data.projectTarget = Math.floor((FAUCET_AMOUNT * donations - FAUCET_AMOUNT / 8) * json.prices[currency]);
				next(data);
			})
			.toss();
	}
}

export function approveProject(data, next) {
	const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.projects.update({\"_id\": ObjectId (\"" + data.projectid + "\") }, {$set: {status: \"approved\"}}, {multi: true})'";
	execSync(cmd);

	frisby.create('/me/projects - check approved status')
		.get(common.api + 'me/projects')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({ closedprojects: [], projects: [{ status: 'approved', title: { en: "Mondo" }, description: { en: "Ciao" }, target: v => v > 0, currency: 'EUR' }] })
		.afterJSON(j => next(data))
		.toss();
}

export function getProjectAddress(data, next) {
	frisby.create('/project/:id/receiveaddress - get project receive address')
		.get(common.api + 'project/' + data.projectid + '/donate?amount=1')
		.expectStatus(200)
		.expectJSON({})
		.afterJSON(function (json) {
			data.projectaddress = json.address;
			next(data);
		})
		.toss();
}
