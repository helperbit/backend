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
frisbyChain({ username: 'testdonationgift_project1', usertype: 'company' }, [
	common.cleanResources('testdonationgift'),

	/* Company */
	userMW.signup,
	userMW.login,
	userMW.checkToken,
	userMW.geolocalizeAsAffected,
	userMW.verifyFake,
	walletMW.createP2SHP2WSH,
	projectMW.createProject,
	projectMW.submitProject,
	projectMW.approveProject,

	/* Send a donation */
	(data, next) => frisby.create('/project/:projectid/donate - get donation address')
		.get(common.api + 'project/' + data.projectid + '/donate?amount=0.001&giftname=gianni&giftmessage=ciao gino!&giftemail=gino@gmail.com')
		.expectStatus(200)
		.afterJSON(function (json) {
			data.txid = walletMW.sendToAddress(json.address, json.amount);
			data.donationid = json.donation;
			next(data);
		})
		.toss(),

	(data, next) => frisby.create('/donation/:txid - check donation data')
		.get(common.api + 'donation/i/' + data.donationid)
		.expectStatus(200)
		.expectJSON({
		})
		.afterJSON(j => next(data))
		.toss(),

	/* Test using an helperbit donation */
	(data, next) => {
		const dataNew = {
			username: 'testdonationgift_userhb',
			usertype: 'singleuser',
			data: data
		};
		next(dataNew);
	},
	userMW.signup,
	userMW.login,
	userMW.checkToken,
	walletMW.createP2SHP2WSH,
	walletMW.faucet,
	walletMW.getWallet,
	walletMW.balance,
	(data, next) => frisby.create('/project/:projectid/donate - get donation address')
		.get(common.api + 'project/' + data.data.projectid + '/donate?amount=0.001&giftname=gianni&giftmessage=ciao gino!&giftemail=gino@gmail.com')
		.expectStatus(200)
		.afterJSON(function (json) {
			data.donation = json;
			next(data);
		})
		.toss(),
	walletMW.withdrawFee,
	walletMW.withdraw,
		
	common.cleanResources('testdonationgift')
]);
