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
	signup, login, checkToken, createAdmins, verifyFake,
	addAdmins
} from '../../tests.shared/middlewares/user';
import {
	signMultisig, createMultisig, feedMultisig, balance,
	faucet, withdrawFee, getWallet
} from '../../tests.shared/middlewares/wallet';
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';


/* Create admins */
frisbyChain({ username: 'testmultisigmultitx_ms1' }, [
	common.cleanResources('testmultisigmultitx'),
	createAdmins('testmultisigmultitx'),

	(data, next) => next({
		username: 'testmultisigmultitx_msmaster',
		usertype: 'npo',
		admins: data.admins,
		adminob: data.adminob
	}),

	/* Create NPO */
	signup,
	login,
	checkToken,

	(data, next) => frisby.create('/wallet/multisig/create - create a multisig wallet E6')
		.post(common.api + 'wallet/multisig/create',
			{ admins: [], n: 2, label: 'Hello!' }, { json: true })
		.expectStatus(401).expectJSON({ error: 'E8' })
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	verifyFake,

	/* Add admins */
	addAdmins,

	/* Create the multisig wallet */
	(data, next) => frisby.create('/wallet/multisig/create - create a multisig wallet E6')
		.post(common.api + 'wallet/multisig/create',
			{ admins: data.admins, n: 2, label: 'Hello!' }, { json: true })
		.expectStatus(401).expectJSON({ error: 'E1' })
		.afterJSON(j => next(data))
		.toss(),


	(data, next) => frisby.create('/wallet/multisig/create - create a multisig wallet EW10')
		.post(common.api + 'wallet/multisig/create',
			{ admins: data.admins, n: 4, label: 'Hello!' }, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'EW10' })
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/wallet/multisig/create - create a multisig wallet EW11')
		.post(common.api + 'wallet/multisig/create',
			{ admins: data.admins, n: 2, label: 'Hello!' }, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'EW11' })
		.afterJSON(j => next(data))
		.toss(),

	/* Create wallet and feed multisigs */
	createMultisig,
	feedMultisig,

	/* Get wallet */
	(data, next) => frisby.create('/wallet - get multisig wallets')
		.get(common.api + 'wallet')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({ wallets: Array })
		.afterJSON(json => {
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

	/* Get a faucet */
	getWallet,
	balance,

	/* Create a withdraw */
	(data, next) => frisby.create('/wallet/:address/withdraw - request a withdraw EW1')
		.post(common.api + 'wallet/' + data.address + '/withdraw',
			{
				"value": 0.05,
				"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
				"fee": 0.00038
			}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'EW1' })
		.afterJSON(j => next(data))
		.toss(),

	faucet,
	balance,
	faucet,
	balance,
	(data, next) => {
		data.wvalue = (data.unconfirmed + data.balance) / 3 - data.fees;
		next(data);
	},
	withdrawFee,


	(data, next) => frisby.create('/wallet/:address/withdraw - request a withdraw - no description')
		.post(common.api + 'wallet/' + data.address + '/withdraw',
			{
				"value": data.unconfirmed + data.balance - data.fees,
				"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
				"fee": data.fees
			}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'E3', data: { name: 'description' } })
		.afterJSON(j => next(data))
		.toss(),


	(data, next) => frisby.create('/wallet/:address/withdraw - request a withdraw EW2')
		.post(common.api + 'wallet/' + data.address + '/withdraw',
			{
				"value": data.unconfirmed + data.balance - data.fees,
				"destination": "m",
				"fee": data.fees,
				"description": "Invio fondi per pagare il frontendista"
			}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'EW2' })
		.afterJSON(j => next(data))
		.toss(),


	(data, next) => {
		data.wvalue = (data.unconfirmed + data.balance) / 3 - data.fees;
		next(data);
	},
	withdrawFee,

	(data, next) => frisby.create('/wallet/:address/withdraw - request a withdraw')
		.post(common.api + 'wallet/' + data.address + '/withdraw',
			{
				"value": (data.unconfirmed + data.balance) / 3 - data.fees,
				"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
				"fee": data.fees,
				"description": "Invio fondi per pagare il frontendista"
			}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),


	(data, next) => {
		data.wvalue = (data.unconfirmed + data.balance) / 2 - data.fees;
		next(data);
	},
	withdrawFee,

	(data, next) => frisby.create('/wallet/:address/withdraw - request a withdraw (multiple tx)')
		.post(common.api + 'wallet/' + data.address + '/withdraw',
			{
				"value": (data.unconfirmed + data.balance) / 2 - data.fees,
				"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
				"fee": data.fees,
				"description": "Invio fondi per pagare il frontendista"
			}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),


	(data, next) => frisby.create('/wallet/:address/withdraw - request a withdraw EW1')
		.post(common.api + 'wallet/' + data.address + '/withdraw',
			{
				"value": data.unconfirmed + data.balance - data.fees,
				"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
				"fee": data.fees,
				"description": "Invio fondi per pagare il frontendista"
			}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(500).expectJSON({ error: 'EW1' })
		.afterJSON(j => next(data))
		.toss(),

	/* Sign multisig withdraw */
	signMultisig,

	common.cleanResources('testmultisigmultitx')
]);



