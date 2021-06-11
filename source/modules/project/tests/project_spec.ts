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
import { signup, login, verifyFake, checkToken, createAdmins, addAdmins, geolocalizeAsAffected } from '../../tests.shared/middlewares/user';
import { estimateProjectTarget, submitProject, approveProject } from '../../tests.shared/middlewares/project';
import {
	createMultisig, feedMultisig, signMultisig, waitDonationConfirmation,
	createP2SHP2WSH, withdraw, withdrawFee, getMultisig, balance,
	faucet, getWallet, withdrawMultisig, waitTxConfirmation
} from '../../tests.shared/middlewares/wallet';
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';
const formdata = require('form-data');
const fs = require('fs');

/* Single user is not able to create a project */
frisbyChain({ username: 'testproject0_project0', usertype: 'singleuser' }, [
	common.cleanResources('testproject0'),
	signup,
	login,
	verifyFake,
	(data, next) => frisby.create('/project/create - create project')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: 20,
			currency: 'EUR'
		}, { json: true })
		.expectStatus(401)
		.afterJSON(j => next(data))
		.toss(),
	(data, next) => frisby.create('/project/create - create project')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: 20,
			currency: 'EUR'
		}, { json: true })
		.expectStatus(401).expectJSON({ error: "E6" })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),
	common.cleanResources('testproject0'),
]);

/* NPO project creation */
frisbyChain({ username: 'testproject1_ms1' }, [
	common.cleanResources('testproject1'),
	(data, next) => frisby.create('/project/unedfined: check malformed id handler')
		.get(common.api + 'project/undefined')
		.expectStatus(500)
		.expectJSON({ error: 'E' })
		.afterJSON(j => next(data))
		.toss(),


	createAdmins('testproject1'),

	(data, next) => next({
		username: 'testproject1_project1',
		usertype: 'npo',
		admins: data.admins,
		adminob: data.adminob
	}),
	estimateProjectTarget(2, 'eur'),

	/* Create NPO */
	signup,
	login,
	checkToken,
	geolocalizeAsAffected,

	(data, next) => frisby.create('/project/create - create project (not verified user)')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: data.projectTarget,
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
	createMultisig,
	feedMultisig,
	getMultisig,


	(data, next) => frisby.create('/project/create - create project (no title)')
		.post(common.api + 'project/create', {
			description: { en: "Ciao" },
			target: data.projectTarget,
			currency: 'EUR',
			receiveaddress: data.address
		}, { json: true })
		.expectStatus(500).expectJSON({ error: "E3", data: { name: 'title' } })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/create - create project (no description)')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			target: data.projectTarget,
			currency: 'EUR',
			receiveaddress: data.address
		}, { json: true })
		.expectStatus(500).expectJSON({ error: "E3", data: { name: 'description' } })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/create - create project (no receive address)')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			target: data.projectTarget,
			currency: 'EUR'
		}, { json: true })
		.expectStatus(500).expectJSON({ error: "E3", data: { name: 'description' } })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/create - create project (no target)')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			currency: 'EUR',
			receiveaddress: data.address
		}, { json: true })
		.expectStatus(500).expectJSON({ error: "E3", data: { name: 'target' } })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/create - create project')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: data.projectTarget,
			currency: 'EUR',
			receiveaddress: data.address
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSONTypes({ id: String })
		.afterJSON(function (json) {
			data.projectid = json.id;
			next(data);
		}).toss(),

	(data, next) => frisby.create('/project/create - create project (wallet in use)')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: 250,
			currency: 'EUR',
			receiveaddress: data.address
		}, { json: true })
		.expectStatus(500)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({ error: 'EP1' })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/:id/edit - edit project (title)')
		.post(common.api + 'project/' + data.projectid + '/edit', {
			title: { en: "" },
		}, { json: true })
		.expectStatus(500).expectJSON({ error: "E3", data: { name: 'title' } })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/:id/edit - edit project (title, description)')
		.post(common.api + 'project/' + data.projectid + '/edit', {
			title: { en: "Mondo" },
			description: { en: "" },
		}, { json: true })
		.expectStatus(500).expectJSON({ error: "E3", data: { name: 'description' } })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/user/:name/projects - list user projects')
		.get(common.api + 'user/testproject1_project1/projects')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({ closedprojects: [], projects: [{ status: 'draft', title: { en: "Mondo" }, description: { en: "Ciao" }, target: data.projectTarget, currency: 'EUR' }] })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/:id/edit - edit project (title, description)')
		.post(common.api + 'project/' + data.projectid + '/edit', {
			title: { en: "Mondo2" },
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/user/:name/projects - list user projects')
		.get(common.api + 'user/testproject1_project1/projects')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({ closedprojects: [], projects: [{ status: 'draft', title: { en: "Mondo2" }, description: { en: "Ciao" }, target: data.projectTarget, currency: 'EUR' }] })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/user/:name/projects - list user projects (no auth)')
		.get(common.api + 'user/testproject1_project1/projects')
		.expectStatus(200)
		.expectJSON({ closedprojects: [], projects: [] })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/:id - info (no auth)')
		.get(common.api + 'project/' + data.projectid + '')
		.expectStatus(404)
		.expectJSON({ error: 'E2' })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/:id - info')
		.get(common.api + 'project/' + data.projectid + '')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({ status: 'draft', title: { en: "Mondo2" }, description: { en: "Ciao" }, target: data.projectTarget, currency: 'EUR' })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/:id/delete - delete')
		.post(common.api + 'project/' + data.projectid + '/delete')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	/* Recreate the project after the last delete */
	(data, next) => frisby.create('/project/create - create project')
		.post(common.api + 'project/create', {
			title: { en: "Mondo" },
			description: { en: "Ciao" },
			target: data.projectTarget,
			currency: 'EUR',
			receiveaddress: data.address
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSONTypes({ id: String })
		.afterJSON(function (json) {
			data.projectid = json.id;
			next(data);
		}).toss(),


	/* Check change history */
	(data, next) => frisby.create('/project/:id/edit - edit project (title)')
		.post(common.api + 'project/' + data.projectid + '/edit', {
			title: { en: "Mondo2" },
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/user/:name/projects - list user projects')
		.get(common.api + 'user/testproject1_project1/projects')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({ closedprojects: [], projects: [{ status: 'draft', title: { en: "Mondo2" }, description: { en: "Ciao" }, target: data.projectTarget, currency: 'EUR' }] })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/:id/edit - edit project (title)')
		.post(common.api + 'project/' + data.projectid + '/edit', {
			title: { en: "Mondo" },
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/project/:id - info')
		.get(common.api + 'project/' + data.projectid + '')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSONTypes('changeHistory.*', {
			changeDate: Date
		})
		.afterJSON(j => next(data))
		.toss(),

	/* Update project with tags and check */
	(data, next) => frisby.create('/project/:id/edit - edit tags')
		.post(common.api + 'project/' + data.projectid + '/edit', {
			tags: ['art', 'nondevecomparire']
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(json => {
			frisby.create('/project/:id - get project info')
				.get(common.api + 'project/' + data.projectid)
				.expectStatus(200)
				.expectJSON({ tags: ['art'] })
				.addHeader('authorization', 'Bearer ' + data.token)
				.afterJSON(j => next(data))
				.toss();
		}).toss(),

	/* Upload a media to the project */
	(data, next) => {
		const form = new formdata();
		form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
			knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
		});
		form.append('name', 'back');

		frisby.create('/project/:id/media - upload a media to the project')
			.post(common.api + 'project/' + data.projectid + '/media', form, { json: false })
			.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
			.addHeader('authorization', 'Bearer ' + data.token)
			.addHeader('content-length', form.getLengthSync())
			.expectJSONTypes({ id: String })
			.expectStatus(200)
			.afterJSON(function (json) {
				const mid = json.id;

				frisby.create('/project/:id - info with media')
					.get(common.api + 'project/' + data.projectid + '')
					.expectStatus(200)
					.addHeader('authorization', 'Bearer ' + data.token)
					.expectJSON({
						status: 'draft',
						title: { en: "Mondo" },
						description: { en: "Ciao" },
						target: data.projectTarget,
						currency: 'EUR',
						media: [mid]
					})
					.afterJSON(json => {
						frisby.create('/project/:id/media/:mid/remove - remove a media from the project')
							.post(common.api + 'project/' + data.projectid + '/media/' + mid + '/remove', {}, { json: true })
							.expectStatus(200)
							.addHeader('authorization', 'Bearer ' + data.token)
							.afterJSON(j => next(data))
							.toss();
					})
					.toss();
			})
			.toss()
	},
	/* Create an activity with drescription */
	(data, next) => frisby.create('/project/:id/activity/new - create a new activity (with description)')
		.post(common.api + 'project/' + data.projectid + '/activity/new', {
			title: { en: 'Ciao mostro!' },
			category: 'update',
			description: { en: "Ciao pinooo!" }
		}, { json: true })
		.expectStatus(200)
		.expectJSONTypes({ id: String })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(function (json) {
			data.aid = json.id;
			next(data);
		})
		.toss(),

	/* Edit the activity with description */
	(data, next) => frisby.create('/project/:id/activity/:aid/edit - edit an activity')
		.post(common.api + 'project/' + data.projectid + '/activity/' + data.aid + '/edit', {
			description: { en: 'Ciao Mostro!' }
		}, { json: false })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(function (json) {
			next(data);
		})
		.toss(),

	/* Remove the activity and check */
	(data, next) => frisby.create('/project/:id/activity/:aid/remove - remove an activity')
		.post(common.api + 'project/' + data.projectid + '/activity/' + data.aid + '/remove', {}, { json: false })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(json => {
			frisby.create('/project/:id - info with activity removed')
				.get(common.api + 'project/' + data.projectid + '')
				.expectStatus(200)
				.addHeader('authorization', 'Bearer ' + data.token)
				.expectJSON({
					status: 'draft',
					title: { en: "Mondo" },
					description: { en: "Ciao" },
					target: data.projectTarget,
					currency: 'EUR',
					activities: []
				})
				.afterJSON(j => next(data))
				.toss();
		})
		.toss(),

	/* Create an activity */
	(data, next) => frisby.create('/project/:id/activity/new - create a new activity')
		.post(common.api + 'project/' + data.projectid + '/activity/new', {
			title: { en: 'Ciao mostro!' },
			category: 'update'
		}, { json: true })
		.expectStatus(200)
		.expectJSONTypes({ id: String })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(function (json) {
			data.aid = json.id;
			next(data);
		})
		.toss(),

	/* Edit the activity */
	(data, next) => frisby.create('/project/:id/activity/:aid/edit - edit an activity')
		.post(common.api + 'project/' + data.projectid + '/activity/' + data.aid + '/edit', {
			title: { en: 'Ciao Mostro!' }
		}, { json: false })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(function (json) {
			frisby.create('/project/:id - info with activity')
				.get(common.api + 'project/' + data.projectid + '')
				.expectStatus(200)
				.addHeader('authorization', 'Bearer ' + data.token)
				.expectJSON({
					status: 'draft',
					title: { en: "Mondo" },
					description: { en: "Ciao" },
					target: data.projectTarget,
					currency: 'EUR',
					media: [],
					activities: [
						{ _id: data.aid, title: { en: 'Ciao Mostro!' }, category: 'update', media: [] }
					]
				})
				.afterJSON(j => next(data))
				.toss();
		})
		.toss(),

	/* Add a media to an activity and remove it, check the activity existence */
	(data, next) => {
		const form = new formdata();
		form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
			knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
		});
		form.append('name', 'back');

		frisby.create('/project/:id/activity/:aid/media - upload a media to the activity')
			.post(common.api + 'project/' + data.projectid + '/activity/' + data.aid + '/media', form, { json: false })
			.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
			.addHeader('authorization', 'Bearer ' + data.token)
			.addHeader('content-length', form.getLengthSync())
			.expectJSONTypes({ id: String })
			.expectStatus(200)
			.afterJSON(function (json) {
				const mid = json.id;

				frisby.create('/project/:id - info with activity')
					.get(common.api + 'project/' + data.projectid + '')
					.expectStatus(200)
					.addHeader('authorization', 'Bearer ' + data.token)
					.expectJSON({
						status: 'draft',
						title: { en: "Mondo" },
						description: { en: "Ciao" },
						target: data.projectTarget,
						currency: 'EUR',
						activities: [
							{ _id: data.aid, title: { en: 'Ciao Mostro!' }, category: 'update', media: [json.id] }
						]
					})
					.afterJSON(json => {
						frisby.create('/project/:id/activity/:aid/media/:mid/remove - remove a media from the activity')
							.post(common.api + 'project/' + data.projectid + '/activity/' + data.aid + '/media/' + mid + '/remove', {}, { json: true })
							.expectStatus(200)
							.addHeader('authorization', 'Bearer ' + data.token)
							.afterJSON(j => next(data))
							.toss();
					})
					.toss();
			})
			.toss();
	},
	/* Remove the activity and check */
	(data, next) => frisby.create('/project/:id/activity/:aid/remove - remove an activity')
		.post(common.api + 'project/' + data.projectid + '/activity/' + data.aid + '/remove', {}, { json: false })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(json => {
			frisby.create('/project/:id - info with activity removed')
				.get(common.api + 'project/' + data.projectid + '')
				.expectStatus(200)
				.addHeader('authorization', 'Bearer ' + data.token)
				.expectJSON({
					status: 'draft',
					title: { en: "Mondo" },
					description: { en: "Ciao" },
					target: data.projectTarget,
					currency: 'EUR',
					activities: []
				})
				.afterJSON(j => next(data))
				.toss();
		})
		.toss(),


	/* Submit project */
	submitProject,
	approveProject,

	/* Get project filtering by tags */
	(data, next) => frisby.create('/projects/list - List project by tag')
		.post(common.api + 'projects/list', {
			tags: ['art']
		}, { json: true })
		.expectStatus(200)
		.expectJSON({
			projects: [
				{
					tags: ['art']
				}
			],
			count: 1
		})
		.afterJSON(j => next(data))
		.toss(),


	/* Get project filtering by title */
	(data, next) => frisby.create('/projects/list - List project by title')
		.post(common.api + 'projects/list', {
			title: 'ondo'
		}, { json: true })
		.expectStatus(200)
		.expectJSON({
			projects: [
				{
					title: { en: 'Mondo' }
				}
			]
		})
		.afterJSON(j => next(data))
		.toss(),

	/* Donate to project */
	(data, next) => frisby.create('/project/:id/receiveaddress - get project receive address')
		.get(common.api + 'project/' + data.projectid + '/donate?amount=1')
		.expectStatus(200)
		.expectJSON({})
		.afterJSON(function (json) {
			data.projectaddress = json.address;
			next(data);
		})
		.toss(),

	(data, next) => frisbyChain({ username: 'testproject1_donation1' }, [
		signup,
		login,
		checkToken,
		createP2SHP2WSH,
		faucet,
		balance,
		getWallet,
		(data2, next2) => {
			data2.destinationaddress = data.projectaddress
			next2(data2);
		},
		withdrawFee,
		withdraw,

		// check the donation to donation
		waitDonationConfirmation,
		(data2, next2) => next(data)
	]),

	/* Check received donation */
	(data, next) => frisby.create('/project/:id - info (first donation)')
		.get(common.api + 'project/' + data.projectid + '')
		.expectStatus(200)
		// todo check received
		.expectJSON({
			target: data.projectTarget,
			currency: 'EUR',
			received: (val) => { return val > 0.004; },
			receiveddonations: 1,
			pending: (val) => { return val > 0.004; },
			used: 0
		})
		.afterJSON(j => next(data))
		.toss(),

	/* Create a withdraw */
	getMultisig,
	balance,
	withdrawFee,
	withdrawMultisig,
	signMultisig,
	waitTxConfirmation,

	/* Check the used field */
	(data, next) => frisby.create('/project/:id - info (first donation, used)')
		.get(common.api + 'project/' + data.projectid + '')
		.expectStatus(200)
		// todo check received
		.expectJSON({
			target: data.projectTarget,
			currency: 'EUR',
			received: (val) => { return val > 0.004; },
			receiveddonations: 1,
			pending: (val) => { return val < 0.0002; },
			used: (val) => { return val > data.projectTarget / 2; }
		})
		.afterJSON(j => next(data))
		.toss(),


	/* Send another donation */
	(data, next) => frisbyChain({ username: 'testproject1_donation2' }, [
		signup,
		login,
		checkToken,
		createP2SHP2WSH,
		faucet,
		balance,
		getWallet,
		(data2, next2) => {
			data2.destinationaddress = data.projectaddress
			next2(data2);
		},
		withdrawFee,
		withdraw,

		// check the donation to donation
		waitDonationConfirmation,
		(data2, next2) => next(data)
	]),

	/* Check project complete */
	(data, next) => frisby.create('/project/:id - info (second donation)')
		.get(common.api + 'project/' + data.projectid + '')
		.expectStatus(200)
		.expectJSON({
			target: data.projectTarget,
			currency: 'EUR',
			received: (val) => { return val > 0.008; },
			receiveddonations: 2,
			pending: (val) => { return val > 0.004; },
			used: (val) => { return val > data.projectTarget / 2; },
			end: (val) => { return val != null }
		}).afterJSON(json => next(data))
		.toss(),
	common.cleanResources('testproject1')
]);
