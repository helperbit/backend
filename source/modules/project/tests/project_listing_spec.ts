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
import common = require('../../tests.shared/middlewares/common');
import {signup, login, checkToken, geolocalizeAsAffected, createAdmins,
	verifyFake, addAdmins} from '../../tests.shared/middlewares/user';
import walletMW = require('../../tests.shared/middlewares/wallet');
import { createProject, submitProject, approveProject } from '../../tests.shared/middlewares/project';
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';


/* NPO project creation */
frisbyChain({}, [
	common.cleanResources('testprojectlisting'),
	createAdmins('testprojectlisting'),

	(data, next) => next({
		username: 'testprojectlisting_project1',
		usertype: 'npo',
		admins: data.admins,
		adminob: data.adminob
	}),

	/* Create NPO */
	signup,
	login,
	checkToken,
	geolocalizeAsAffected,


	(data, next) => frisby.create('/project/create - create project (not verified user)')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: 200,
			currency: 'EUR'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(401).expectJSON({ error: "E8" })
		.afterJSON(j => next(data))
		.toss(),
	verifyFake,

	/* Add admins */
	addAdmins,

	/* Create wallet and feed multisigs */
	walletMW.createMultisig,
	walletMW.feedMultisig,
	walletMW.getMultisig,

	createProject,

	/* Update project with tags and check */
	(data, next) => frisby.create('/project/:id/edit - edit tags')
		.post(common.api + 'project/' + data.projectid + '/edit', {
			tags: ['education', 'nondevecomparire']
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(json => {
			frisby.create('/project/:id - get project info')
				.get(common.api + 'project/' + data.projectid)
				.expectStatus(200)
				.expectJSON({ tags: ['education'] })
				.addHeader('authorization', 'Bearer ' + data.token)
				.afterJSON(j => next(data))
				.toss();
		}).toss(),

	submitProject,
	approveProject,


	(data, next) => frisby.create('/projects/list - get projects')
		.post(common.api + 'projects/list')
		.expectStatus(200)
		.afterJSON(json => {
			// console.log(JSON.stringify(json))
		}).toss(),


	common.cleanResources('testprojectlisting')
]);
