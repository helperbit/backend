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
import userMW = require('../../tests.shared/middlewares/user');
import walletMW = require('../../tests.shared/middlewares/wallet');
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';
const formdata = require('form-data');
const fs = require('fs');

frisbyChain({}, [
	common.cleanResources('testrorreject'),

	/* Company */
	(dataMain, nextMain) => frisbyChain(dataMain, [
		(data, next) => next({ username: 'testrorreject_company', usertype: 'company' }),
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		userMW.verifyFake,
		walletMW.createP2SHP2WSH,
		(data, next) => frisby.create('/wallet - wallet list')
			.get(common.api + 'wallet')
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.expectJSON({ receiveaddress: data.address })
			.expectJSONTypes({ wallets: Array, receiveaddress: String })
			.expectJSONTypes('wallets.*', {
				owner: String,
				ismultisig: Boolean,
				pubkeys: Array,
				creationdate: String,
				label: String,
				address: String
			})
			.afterJSON(j => {
				dataMain.company = data;
				nextMain(dataMain);
			})
			.toss()
	]),


	userMW.createAdmins('testrorreject'),

	(data, next) => next({
		username: 'testrorreject_msmaster',
		usertype: 'npo',
		admins: data.admins,
		adminob: data.adminob,
		company: data.company
	}),

	/* Create NPO */
	userMW.signup,
	userMW.login,
	userMW.checkToken,
	userMW.verifyFake,

	/* Add admins */
	userMW.addAdmins,

	/* Create wallet and feed multisigs */
	walletMW.createMultisig,
	walletMW.feedMultisig,

	/* Get wallet */
	(data, next) => frisby.create('/wallet - get multisig wallets')
		.get(common.api + 'wallet')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({ wallets: Array })
		.afterJSON(function (json) {
			data.address = json.wallets[0].address;
			next(data);
		})
		.toss(),

	(data, next) => frisby.create('/wallet/:address - get multisig wallet')
		.get(common.api + 'wallet/' + data.address)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({
			address: String,
			label: String,
			owner: String,
			creationdate: String,
			pubkeys: Array,
			ismultisig: Boolean
		})
		.expectJSONTypes('multisig', { n: Number, admins: Array, active: Boolean })
		.expectJSON('multisig', { n: 3, admins: data.admins, active: true })
		.afterJSON(j => next(data))
		.toss(),

	/* Log in as a company and create a ror */
	(dataMain, nextMain) => frisbyChain(dataMain.company, [
		userMW.login,
		userMW.checkToken,
		(data, next) => frisby.create('/me/rors - get rors list')
			.get(common.api + 'me/rors')
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.expectJSONTypes('rors.*', {
				to: String,
				value: Number,
				currency: String,
				from: String,
				description: String,
				invdate: String,
				invvat: String
			})
			.expectJSONTypes('rors', Array)
			.afterJSON(j => next(data))
			.toss(),

		(data, next) => frisby.create('/me/rors/tolist - get rors tolist')
			.get(common.api + 'me/rors/tolist')
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.expectJSONTypes('users.*', {
				username: String,
				usertype: String,
				fullname: String
			})
			.expectJSONTypes('users', Array)
			.afterJSON(j => next(data))
			.toss(),

		/* Create the ror */
		(data, next) => {
			const form = new formdata();
			form.append('value', '10.0');
			form.append('currency', 'EUR');
			form.append('description', 'ciao mondo pinco');
			form.append('invvat', 'eurasdasd');
			form.append('invdate', '12/12/12');
			form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
				knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
			});

			frisby.create('/user/testrorreject_msmaster/ror')
				.post(common.api + 'user/testrorreject_msmaster/ror', form, { json: false })
				.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
				.addHeader('authorization', 'Bearer ' + data.token)
				.addHeader('content-length', form.getLengthSync())
				.expectStatus(200)
				.afterJSON(j => next(data))
				.toss();
		},
		userMW.checkToken,
		(data, next) => frisby.create('/me/rors - get rors list')
			.get(common.api + 'me/rors')
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.expectJSONTypes('rors.*', {
				to: String,
				value: Number,
				currency: String,
				from: String,
				description: String,
				invdate: String,
				invvat: String,
				status: String
			})
			.expectJSONTypes('rors', Array)
			.waits(5000)
			.afterJSON(j => next(data))
			.toss(),

		(data, next) => {
			dataMain.company = data;
			nextMain(dataMain);
		}
	]),

	/* Log in as npo and proceed with the ror */
	(dataMain, nextMain) => frisbyChain(dataMain, [
		userMW.login,
		userMW.checkToken,
		(data, next) => frisby.create('/me/rors - get rors list')
			.get(common.api + 'me/rors')
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.expectJSON('rors.*', {
				status: 'pending'
			})
			.expectJSONTypes('rors.*', {
				to: String,
				value: Number,
				currency: String,
				from: String,
				description: String,
				invdate: String,
				invvat: String,
				status: String
			})
			.expectJSONTypes('rors', Array)
			.afterJSON(function (json) {
				data.ror = json.rors[0]._id;
				data.rordest = json.rors[0].receiveaddress;
				next(data);
			})
			.toss(),

		(data, next) => frisby.create('/me/ror/:id/reject - reject a ror (no reason)')
			.post(common.api + 'me/ror/' + data.ror + '/reject',
				{}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(500)
			.expectJSON({ error: 'E3' })
			.afterJSON(j => next(data))
			.toss(),

		(data, next) => frisby.create('/me/ror/:id/reject - reject a ror')
			.post(common.api + 'me/ror/' + data.ror + '/reject',
				{
					reason: 'nooooooooooooo'
				}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.afterJSON(j => next(data))
			.toss(),

		(data, next) => frisby.create('/me/rors - get rors list')
			.get(common.api + 'me/rors')
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.expectJSON('rors.*', {
				status: 'rejected'
			})
			.expectJSONTypes('rors.*', {
				to: String,
				value: Number,
				currency: String,
				from: String,
				description: String,
				invdate: String,
				invvat: String,
				status: String
			})
			.expectJSONTypes('rors', Array)
			.afterJSON(function (json) {
				data.ror = json.rors[0]._id;
				next(data);
			})
			.toss(),
	]),
	common.cleanResources('testrorreject')
]);



