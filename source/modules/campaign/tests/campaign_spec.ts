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
import {
	geolocalizeAsAffected, createAdmins, signup, login, checkToken,
	verifyFake, addAdmins
} from '../../tests.shared/middlewares/user';
import walletMW = require('../../tests.shared/middlewares/wallet');
import { createProject, submitProject, approveProject } from '../../tests.shared/middlewares/project';
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';
const formdata = require('form-data');
const fs = require('fs');


/* NPO project creation */
frisbyChain({}, [
	common.cleanResources('testcampaign'),
	createAdmins('testcampaign'),

	(data, next) => next({
		username: 'testcampaign_project1',
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

	/* Create a single user and login */
	(dataproject, next) => next({ username: 'testcampaign_single', project: dataproject }),
	signup,
	login,
	checkToken,

	/* Create a campaign for the project */
	(data, next) => frisby.create('/campaign/create - create campaign (not logged)')
		.post(common.api + 'campaign/create', {
			title: "Mondo",
			description: "Ciao",
			target: 200,
			currency: 'EUR'
		}, { json: true })
		.expectStatus(401).expectJSON({ error: "E1" })
		.afterJSON(j => next(data))
		.toss(),
	(data, next) => frisby.create('/campaign/create - create campaign')
		.post(common.api + 'campaign/create', {
			title: "Mondo",
			description: "Ciao mondo",
			target: 200,
			currency: 'EUR',
			resource: data.project.projectid,
			type: 'project'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({ id: String })
		.afterJSON(json => {
			data.campaignid = json.id;
			next(data);
		})
		.toss(),

	/* Delete and create a campaign */
	(data, next) => frisby.create('/campaign/:id/delete - delete campaign')
		.post(common.api + 'campaign/' + data.campaignid + '/delete', {}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),


	/* Create a campaign above max */
	(data, next) => frisby.create('/campaign/create - create above max target')
		.post(common.api + 'campaign/create', {
			title: "Mondo",
			description: "Ciao dudo",
			target: 250,
			currency: 'EUR',
			resource: data.project.projectid,
			type: 'project'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'EC5' })
		.afterJSON(j => next(data))
		.toss(),

	/* Create a campaign wrong res */
	(data, next) => frisby.create('/campaign/create - wrong resource')
		.post(common.api + 'campaign/create', {
			title: "Mondo",
			description: "Ciao dudo",
			target: 250,
			currency: 'EUR',
			resource: 'dingooo',
			type: 'project'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'EC4' })
		.afterJSON(j => next(data))
		.toss(),

	/* Create the campaign */
	(data, next) => frisby.create('/campaign/create - create campaign')
		.post(common.api + 'campaign/create', {
			title: "Mondo",
			description: "Ciao mondo marcio",
			target: 200,
			currency: 'EUR',
			resource: data.project.projectid,
			type: 'project'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({ id: String })
		.afterJSON(json => {
			data.campaignid = json.id;
			next(data);
		})
		.toss(),

	(data, next) => frisby.create('/campaign/:id - info')
		.get(common.api + 'campaign/' + data.campaignid + '')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSONTypes('changeHistory.*', {
			changeDate: Date
		})
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/campaign/:id - get the campaign, check if the amount is remodulated to max')
		.get(common.api + 'campaign/' + data.campaignid)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON({
			target: 200
		})
		.afterJSON(j => next(data))
		.toss(),


	/* Upload a photo */
	(data, next) => {
		const form = new formdata();
		form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
			knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
		});

		frisby.create('/campaign/:id/media - upload a media')
			.post(common.api + 'campaign/' + data.campaignid + '/media', form, { json: false })
			.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
			.addHeader('authorization', 'Bearer ' + data.token)
			.addHeader('content-length', form.getLengthSync())
			.expectStatus(200)
			.expectJSONTypes({ id: String })
			.afterJSON(j => next(data))
			.toss();
	},

	/* Get the campaign */
	(data, next) => frisby.create('/campaign/:id - get a campaign, noauth')
		.get(common.api + 'campaign/' + data.campaignid)
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/campaign/:id - get the campaign')
		.get(common.api + 'campaign/' + data.campaignid)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/me/campaigns - get the campaigns')
		.get(common.api + 'me/campaigns')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON('campaigns.*', {
			status: 'started',
			title: 'Mondo'
		})
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/me/campaigns - get the campaigns')
		.get(common.api + 'me/campaigns')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON('campaigns.*', {
			status: 'started',
			title: 'Mondo'
		})
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/campaign/:id - get the campaign')
		.get(common.api + 'campaign/' + data.campaignid)
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),


	(data, next) => frisby.create('/campaign/create - create campaign')
		.post(common.api + 'campaign/create', {
			title: "Mondo",
			description: "Ciao",
			target: 200,
			currency: 'EUR'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'EC1' })
		.afterJSON(j => next(data))
		.toss(),

	/* Get campaign donation */
	(data, next) => frisby.create('/campaign/:id/donations - get campaign donations')
		.get(common.api + 'campaign/' + data.campaignid + '/donations')
		.expectStatus(200)
		.afterJSON(json => {
			data = { campaign: data, project: data.project, username: 'testcampaign_single2' };
			next(data);
		})
		.toss(),

	/* Create e new user with a wallet and try to donate to the campaign */
	signup,
	login,
	checkToken,
	walletMW.createP2SHP2WSH,
	walletMW.faucet,
	walletMW.getWallet,
	walletMW.balance,

	(data, next) => frisby.create('/project/:project/donate - create a donation to a project')
		.get(common.api + 'project/' + data.project.projectid + '/donate?campaign=' + data.campaign.campaignid + '&amount=0.0045')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(function (json) {
			data.donation = json;
			next(data);
		})
		.toss(),

	walletMW.withdrawFee,
	walletMW.withdraw,
	walletMW.waitDonationConfirmation,

	/* Get campaign donation */
	(data, next) => frisby.create('/campaign/:id/donations - get campaign donations')
		.get(common.api + 'campaign/' + data.campaign.campaignid + '/donations')
		.expectStatus(200)
		.expectJSON('donations.*', {
			_id: data.donation.donation,
			value: data.donation.amount,
			campaign: data.campaign.campaignid
		})
		.afterJSON(j => next(data))
		.toss(),

	/* Get project donation */
	(data, next) => frisby.create('/campaign/:id/donations - get campaign donations')
		.get(common.api + 'project/' + data.project.projectid + '/donations')
		.expectStatus(200)
		.expectJSON('donations.*', {
			_id: data.donation.donation,
			value: data.donation.amount,
			campaign: data.campaign.campaignid
		})
		.afterJSON(json => {
			data.donationdata = json.donations[0];
			next(data);
		})
		.toss(),

	/* Get the campaign */
	(data, next) => frisby.create('/campaign/:id - get the campaign')
		.get(common.api + 'campaign/' + data.campaign.campaignid)
		.expectStatus(200)
		.expectJSON({
			currency: 'EUR',
			receiveddonations: 1,
			receivedconverted: function (v) { return v > 10 },
			received: data.donation.amount,
			percentage: function (v) { return v > 5; }
		})
		.afterJSON(j => next(data))
		.toss(),

	common.cleanResources('testcampaign')
]);
