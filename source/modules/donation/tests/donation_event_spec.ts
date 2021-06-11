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

frisbyChain({ username: 'testdonationevent_donation0' }, [
	common.cleanResources('testdonationevent'),
	userMW.signup,
	userMW.login,
	userMW.checkToken,
	walletMW.createP2SHP2WSH,
	userMW.geolocalizeAsAffected,

	/* Affected users for event */
	(data, next) => frisby.create('/event/:id/affectedusers - affected users for event')
		.get(common.api + 'event/' + data.eventid + '/affectedusers')
		.expectStatus(200)
		.expectJSONTypes({
			singleuser: Array,
			npo: Array,
			school: Array,
			park: Array,
			munic: Array,
			cultural: Array,
			hospital: Array,
			civilprotection: Array
		})
		.expectJSONTypes('singleuser.*', {
			username: String,
			receiveaddress: String,
			received: Number,
			trustlevel: Number,
			usertype: String
		})
		.afterJSON(j => next(data))
		.toss(),

	/* Donate to the user */
	(data, next) => frisbyChain({ username: 'testdonationevent_donation1' }, [
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		walletMW.createP2SHP2WSH,
		walletMW.faucet,
		walletMW.balance,
		walletMW.getWallet,
		(data2, next2) => frisby.create('/donation/create - create a donation to a single user')
			.post(common.api + 'donation/create', {
				"address": data2.address,
				"value": data2.balance - 0.001 - 0.0001,
				"fee": 0.0001,
				"event": data.eventid,
				"users": { 'testdonationevent_donation0': data2.balance - 0.001 - 0.0001 },
			}, { json: true })
			.expectStatus(200)
			.waits(2000)
			.addHeader('authorization', 'Bearer ' + data2.token)
			.afterJSON(json => {
				const signedhex = walletMW.signTx(json.txhex, data2.privkey);

				frisby.create('/wallet/:address/send - send donation')
					.post(common.api + 'wallet/' + data2.address + '/send',
						{ "txhex": signedhex, "donation": json.donation }, { json: true })
					.expectStatus(200)
					.addHeader('authorization', 'Bearer ' + data2.token)
					.afterJSON(json => frisby.create('/donation/:txid - get donation')
						.get(common.api + 'donation/' + json.txid)
						.addHeader('authorization', 'Bearer ' + data.token)
						.expectStatus(200)
						.expectJSON({ status: 'confirmed' })
						.retry(1000, 5000)
						.afterJSON(j => next2(data))
						.toss())
					.toss();
			})
			.toss()
	]),

	/* Get back money from received donation */
	walletMW.getWallet,
	walletMW.balance,
	walletMW.withdrawFee,
	walletMW.withdraw,
	common.cleanResources('testdonationevent')
]);
