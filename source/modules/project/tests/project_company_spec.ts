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
import { signup, login, verifyFake, geolocalizeAsAffected, checkToken } from '../../tests.shared/middlewares/user';
import {
	createP2SHP2WSH, getWallet, balance, withdrawFee, withdraw,
	waitDonationConfirmation, faucet, getMultisig
} from '../../tests.shared/middlewares/wallet';
import { submitProject, approveProject, estimateProjectTarget } from '../../tests.shared/middlewares/project';
import { TestChain } from '../../tests.shared/middlewares/frisby-chain';
import { TestRequest } from '../../tests.shared/middlewares/test-request';

const chain = new TestChain('testprojectcompany', { enableBitcoin: true });

chain.pushData({ username: 'testprojectcompany_project1', usertype: 'company' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);
chain.push(geolocalizeAsAffected);
chain.push(estimateProjectTarget(2, 'eur'));

chain.pushReq(TestRequest.post('/project/create', 'create project (not verified user)', data => ({
	title: { en: "Mondo" },
	description: { en: "Ciao" },
	target: data.projectTarget,
	currency: 'EUR'
})).authenticate().expect(401, { error: "E6" }));

chain.push(verifyFake);
chain.push(createP2SHP2WSH);

chain.pushReq(TestRequest.post('/project/create', 'create project (no title)', data => ({
	description: { en: "Ciao" },
	target: data.projectTarget,
	currency: 'EUR',
	receiveaddress: data.address
})).authenticate().expect(500, { error: "E3", data: { name: 'title' } }));

chain.pushReq(TestRequest.post('/project/create', 'create project (no description)', data => ({
	title: { en: "Mondo" },
	target: data.projectTarget,
	currency: 'EUR',
	receiveaddress: data.address
})).authenticate().expect(500, { error: "E3", data: { name: 'description' } }));

chain.pushReq(TestRequest.post('/project/create', 'create project (no receive address)', data => ({
	title: { en: "Mondo" },
	target: data.projectTarget,
	currency: 'EUR'
})).authenticate().expect(500, { error: "E3", data: { name: 'description' } }));

chain.push((data, next) => frisby.create('/project/create - create project (no target)')
	.post(common.api + 'project/create', {
		title: { en: "Mondo" },
		description: { en: "Ciao" },
		currency: 'EUR',
		receiveaddress: data.address
	}, { json: true })
	.expectStatus(500).expectJSON({ error: "E3", data: { name: 'target' } })
	.addHeader('authorization', 'Bearer ' + data.token)
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/project/create - create project')
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
	}).toss());

chain.push((data, next) => frisby.create('/project/:id/edit - edit project (title)')
	.post(common.api + 'project/' + data.projectid + '/edit', {
		title: { en: "" },
	}, { json: true })
	.expectStatus(500).expectJSON({ error: "E3", data: { name: 'title' } })
	.addHeader('authorization', 'Bearer ' + data.token)
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/project/:id/edit - edit project (title, description)')
	.post(common.api + 'project/' + data.projectid + '/edit', {
		title: { en: "Mondo" },
		description: { en: "" },
	}, { json: true })
	.expectStatus(500).expectJSON({ error: "E3", data: { name: 'description' } })
	.addHeader('authorization', 'Bearer ' + data.token)
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/user/:name/projects - list user projects')
	.get(common.api + 'user/testprojectcompany_project1/projects')
	.expectStatus(200)
	.addHeader('authorization', 'Bearer ' + data.token)
	.expectJSON({ closedprojects: [], projects: [{ status: 'draft', title: { en: "Mondo" }, description: { en: "Ciao" }, target: data.projectTarget, currency: 'EUR' }] })
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/user/:name/projects - list user projects (no auth)')
	.get(common.api + 'user/testprojectcompany_project1/projects')
	.expectStatus(200)
	.expectJSON({ closedprojects: [], projects: [] })
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/project/:id - info (no auth)')
	.get(common.api + 'project/' + data.projectid + '')
	.expectStatus(404)
	.expectJSON({ error: 'E2' })
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/project/:id - info')
	.get(common.api + 'project/' + data.projectid + '')
	.expectStatus(200)
	.addHeader('authorization', 'Bearer ' + data.token)
	.expectJSON({ status: 'draft', title: { en: "Mondo" }, description: { en: "Ciao" }, target: data.projectTarget, currency: 'EUR' })
	.afterJSON(j => next(data))
	.toss());

chain.push((data, next) => frisby.create('/project/:id/delete - delete')
	.post(common.api + 'project/' + data.projectid + '/delete')
	.expectStatus(200)
	.addHeader('authorization', 'Bearer ' + data.token)
	.afterJSON(j => next(data))
	.toss());

/* Recreate the project after the last delete */
chain.push((data, next) => frisby.create('/project/create - create project')
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
	}).toss());

chain.push(submitProject);
chain.push(approveProject);


/* Donate to project */
chain.push((data, next) => frisby.create('/project/:id/receiveaddress - get project receive address')
	.get(common.api + 'project/' + data.projectid + '/donate?amount=1')
	.expectStatus(200)
	.expectJSON({})
	.afterJSON(function (json) {
		data.projectaddress = json.address
		next(data);
	})
	.toss());

chain.pushChain((new TestChain())
	.pushData({ username: 'testprojectcompany_donation1' })
	.push(signup)
	.push(login)
	.push(checkToken)
	.push(createP2SHP2WSH)
	.push(faucet)
	.push(balance)
	.push(getWallet)
	.push((data, next) => {
		data.destinationaddress = data.outerData.projectaddress;
		next(data);
	})
	.push(withdrawFee)
	.push(withdraw)

	// check the donation to donation
	.push(waitDonationConfirmation)
);

/* Check received donation */
chain.push((data, next) => frisby.create('/project/:id - info')
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
	.toss());

/* Create a withdraw */
chain.push(getMultisig);
chain.push(balance);
chain.push(withdrawFee);
chain.push(withdraw);

/* Check the used field */
chain.push((data, next) => frisby.create('/project/:id - info')
	.get(common.api + 'project/' + data.projectid + '')
	.expectStatus(200)
	// todo check received
	.expectJSON({
		target: data.projectTarget,
		currency: 'EUR',
		received: (val) => { return val > 0.004; },
		receiveddonations: 1,
		pending: (val) => { return val > 0.004; }, // TODO: da risolvere l'used per company (val) => { return val < 0.0002; },
		used: 0 // TODO: da risolvere l'used per company (val) => { return val > data.projectTarget / 2; }
	})
	.afterJSON(j => next(data))
	.toss());

/* Send another donation */
chain.pushChain((new TestChain())
	.pushData({ username: 'testprojectcompany_donation2' })
	.push(signup)
	.push(login)
	.push(checkToken)
	.push(createP2SHP2WSH)
	.push(faucet)
	.push(balance)
	.push(getWallet)
	.push((data, next) => {
		data.destinationaddress = data.outerData.projectaddress;
		next(data);
	})
	.push(withdrawFee)
	.push(withdraw)

	// check the donation to donation
	.push(waitDonationConfirmation)
);
/* Check project complete */
chain.push((data, next) => frisby.create('/project/:id - info')
	.get(common.api + 'project/' + data.projectid + '')
	.expectStatus(200)
	.expectJSON({
		target: data.projectTarget,
		currency: 'EUR',
		received: (val) => { return val > 0.008; },
		receiveddonations: 2,
		pending: (val) => { return val > 0.008; }, // TODO: da risolvere l'used per company { return val > 0.004; },
		used: 0, // TODO: da risolvere l'used per company   (val) =>  { return val > data.projectTarget / 2; },
		end: (val) => { return val != null }
	})
	.afterJSON(j => next(data))
	.toss());

chain.exec();
