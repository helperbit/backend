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
const execSync = require('sync-exec');
import common = require('../../tests.shared/middlewares/common');
import userMW = require('../../tests.shared/middlewares/user');
import walletMW = require('../../tests.shared/middlewares/wallet');
import projectMW = require('../../tests.shared/middlewares/project');
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';

/* NPO project creation */
frisbyChain({ username: 'testdonmproj_project1', usertype: 'company' }, [
	common.cleanResources('testdonmproj'),

	/* Company */
	userMW.signup,
	userMW.login,
	userMW.checkToken,
	userMW.geolocalizeAsAffected,

	(data, next) => frisby.create('/project/create - create project (not verified user)')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: 200,
			currency: 'EUR'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(401).expectJSON({ error: "E6" })
		.afterJSON(j => next(data))
		.toss(),

	userMW.verifyFake,
	walletMW.createP2SHP2WSH,

	projectMW.createProject,
	projectMW.submitProject,
	projectMW.approveProject,
	projectMW.getProjectAddress,
	(data, next) => next({ username: 'testdonmproj_project2', usertype: 'company', project1: data }),

	/* Company */
	userMW.signup,
	userMW.login,
	userMW.checkToken,
	userMW.geolocalizeAsAffected,


	(data, next) => frisby.create('/project/create - create project (not verified user)')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: 200,
			currency: 'EUR'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(401).expectJSON({ error: "E6" })
		.afterJSON(j => next(data))
		.toss(),

	userMW.verifyFake,
	walletMW.createP2SHP2WSH,

	projectMW.createProject,
	projectMW.submitProject,
	projectMW.approveProject,
	projectMW.getProjectAddress,
	(data, next) => next({ project1: data.project1, project2: data }),

	/* Send a donation to two project */
	(data, next) => {
		const destList = {};
		destList[data.project1.projectaddress] = 0.0052;
		destList[data.project2.projectaddress] = 0.0048;
		data.txid = walletMW.sendToMany(destList);
		next(data);
	},
	walletMW.waitDonationDetect,
	(data, next) => frisby.create('/donation/:txid - check donation data')
		.get(common.api + 'donation/' + data.txid)
		.expectStatus(200)
		.expectJSON({
			value: 0.0052 + 0.0048
		})
		.afterJSON(j => next(data))
		.toss(),
	common.cleanResources('testdonmproj')
]);
