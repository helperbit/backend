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
import { login, signup, checkToken, verifyFake, addAdmins,
	createAdmins } from '../../tests.shared/middlewares/user';
import { createMultisig, faucet, getWallet, balance, withdrawFee, 
	signVerifyMultisig, signMultisig, feedMultisig } from '../../tests.shared/middlewares/wallet';
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';

frisbyChain({ username: 'testwalletvermulti_1' }, [
	common.cleanResources('testwalletvermulti'),
	createAdmins('testwalletvermulti'),

	(data, next) => next({
		username: 'testwalletvermulti_msmaster',
		usertype: 'npo',
		admins: data.admins,
		adminob: data.adminob
	}),

	/* Create NPO */
	signup,
	login,
	checkToken,
	verifyFake,
	addAdmins,
	createMultisig,
	feedMultisig,

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
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/wallet/verify/list - wallet verify')
		.get(common.api + 'wallet/verify/list')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({ verifications: Array })
		.expectJSONTypes('verifications.*', {
			ismultisig: Boolean,
			label: String,
			address: String,
			lastverify: Date,
		})
		.expectJSONTypes('verifications.*.history', {
			status: String,
			time: Date,
			value: Number,
			locktime: Number
		})
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/wallet/:address/verify/start - start verify')
		.post(common.api + 'wallet/' + data.address + '/verify/start')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => {
			data.tltx = j._id;
			next(data);
		})
		.toss(),

	(data, next) => frisby.create('/wallet/verify/:id - get a tltx')
		.get(common.api + 'wallet/verify/' + data.tltx)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => {
			data.tltx_data = j;
			next(data);
		})
		.toss(),

	(data, next) => frisby.create('/wallet/:address/verify/start - start verify (already exists)')
		.post(common.api + 'wallet/' + data.address + '/verify/start')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500)
		.expectJSON({ error: "EWV1" })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/wallet/verify/pending - get pending tltx')
		.get(common.api + 'wallet/verify/pending')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes('pending.*', {
			status: String,
			_id: String,
			time: Date,
			locktime: Number,
			wallet: {
				id: String,
				label: String,
				address: String,
				ismultisig: Boolean
			}
		})
		.afterJSON(j => next(data))
		.toss(),

	signVerifyMultisig,


	faucet,
	getWallet,
	balance,

	(data, next) => frisby.create('/wallet/:address/verify/start - start verify')
		.post(common.api + 'wallet/' + data.address + '/verify/start')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => {
			data.tltx = j._id;
			next(data);
		})
		.toss(),

	(data, next) => frisby.create('/wallet/verify/:id - get a tltx')
		.get(common.api + 'wallet/verify/' + data.tltx)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => {
			data.tltx_data = j;
			next(data);
		})
		.toss(),

	signVerifyMultisig,

	(data, next) => frisby.create('/wallet/verify/:id - get a tltx')
		.get(common.api + 'wallet/verify/' + data.tltx)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => {
			next(data);
		})
		.toss(),

	getWallet,
	balance,
	withdrawFee,

	function (data, next) {
		frisby.create('/wallet/:address/withdraw - request a withdraw')
			.post(common.api + 'wallet/' + data.address + '/withdraw',
				{
					"value": data.unconfirmed + data.balance - data.fees,
					"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
					"fee": data.fees,
					"description": "Invio fondi per pagare il frontendista"
				}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.afterJSON(json => {
				next(data);
			})
			.toss();
	},

	/* Sign multisig withdraw */
	signMultisig,
	common.cleanResources('testwalletvermulti')
]);

