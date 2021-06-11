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
import { createP2WSH, faucet, getWallet, balance, withdraw, withdrawFee } from '../../tests.shared/middlewares/wallet';
import { TestChain } from '../../tests.shared/middlewares/frisby-chain';
import { TestRequest } from '../../tests.shared/middlewares/test-request';


const chain = new TestChain('testp2wshwallet', { enableBitcoin: true });

chain.pushData({ username: 'testp2wshwallet_wallet1' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);
chain.push(createP2WSH);
chain.pushReq(TestRequest.post('/wallet/create', 'create wallet', {})
	.expect(401));

chain.push((data, next) => frisby.create('/wallet - wallet list')
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
	.toss());

chain.push((data, next) => frisby.create('/user/:name/addresses - user address list')
	.get(common.api + 'user/' + data.username + '/addresses')
	.expectStatus(200)
	.expectJSON({ addresses: [data.address] })
	.expectJSONTypes({ addresses: Array })
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/wallet/:address/update - update address')
	.post(common.api + 'wallet/' + data.address + '/update', { label: 'test2' })
	.addHeader('authorization', 'Bearer ' + data.token)
	.expectStatus(200)
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/wallet/:address/balance - wallet balance')
	.get(common.api + 'wallet/' + data.address + '/balance')
	.addHeader('authorization', 'Bearer ' + data.token)
	.expectStatus(200)
	.expectJSON({ balance: 0.0, unconfirmed: 0.0, received: 0.0 })
	.expectJSONTypes({ unconfirmed: Number, balance: Number, received: Number })
	.afterJSON(j => next(data))
	.toss());

/* Create another wallet */
chain.push(createP2WSH);

chain.push((data, next) => frisby.create('/wallet - wallet list')
	.get(common.api + 'wallet')
	.addHeader('authorization', 'Bearer ' + data.token)
	.expectStatus(200)
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
	.toss());

chain.push((data, next) => frisby.create('/wallet/:address/update - update address label with already used label')
	.post(common.api + 'wallet/' + data.address + '/update', { label: 'test2' })
	.addHeader('authorization', 'Bearer ' + data.token)
	.expectStatus(500)
	.expectJSON({ error: 'E3' })
	.afterJSON(j => next(data))
	.toss());

chain.push(faucet);
chain.push(getWallet);
chain.push(balance);
chain.push(withdrawFee);
chain.push(withdraw);

chain.exec();

