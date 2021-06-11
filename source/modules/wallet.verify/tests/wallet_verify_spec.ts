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
import { signup, login, checkToken } from '../../tests.shared/middlewares/user';
import { createP2SHP2WSH } from '../../tests.shared/middlewares/wallet';
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';

frisbyChain({ username: 'testwalletverify_1' }, [
	common.cleanResources('testwalletverify'),
	signup,
	login,
	checkToken,
	createP2SHP2WSH,

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

	common.cleanResources('testwalletverify')
]);

