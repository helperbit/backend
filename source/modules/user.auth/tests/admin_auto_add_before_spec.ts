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

import {
	signup, login, checkToken, setAllowedAdminsVerify,
	acceptVerification
} from '../../tests.shared/middlewares/user';
import { TestChain } from '../../tests.shared/middlewares/frisby-chain';
import { TestRequest } from '../../tests.shared/middlewares/test-request';


const chain = new TestChain('testadminautobeforeadd');

chain.pushData({ username: 'testadminautobeforeadd_ms1' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);

chain.pushData({ username: 'testadminautobeforeadd_ms2' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);

chain.pushData({ username: 'testadminautobeforeadd_ms3' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);


chain.pushData({ username: 'testadminautobeforeadd_npo', usertype: 'npo' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);


chain.pushReq(TestRequest.post('/me', 'complete profile', {
	fullname: 'Davide Gessa NOPROF',
	contries: ['ITA'],
	tags: ["education"],
	vat: "1234324",
	operators: '2-10',
	street: 'via dei conversi',
	referent: {
		firstname: "Gianni",
		lastname: "Culo",
		idnumber: "AX3424",
		email: "frisby@gmail.com"
	},
	streetnr: '130',
	zipcode: '09136',
	country: 'ITA',
	city: 'Cagliari',
	website: 'davidegessa.wordpress.com',
	birthdate: new Date(1990, 12, 11),
	location: { coordinates: [9.14, 39.218], type: 'Point' }
}).authenticate().expect(200));

/* NPO Admins Verification */
chain.pushReq(TestRequest.post('/me/verify/npoadmins/step/0', '', {
	admins: [
		{
			firstname: "Gianni",
			lastname: "Pinolo",
			email: "testadminautobeforeadd_ms1@gmail.com",
			idnumber: "AX4535435"
		},
		{
			firstname: "Gianni",
			lastname: "Pinolo",
			email: "testadminautobeforeadd_ms2@gmail.com",
			idnumber: "AX4535435"
		},
		{
			firstname: "Gianni",
			lastname: "Pinolo",
			email: "testadminautobeforeadd_ms3@gmail.com",
			idnumber: "AX4535435"
		}
	]
}).authenticate().expect(200));

chain.pushReq(TestRequest.postFile('/me/verify/npoadmins/step/1', '', 'test.png')
	.authenticate().expect(200));

chain.pushReq(TestRequest.post('/me/verify/npoadmins/step/2', '', {})
	.authenticate().expect(200));


chain.pushReq(TestRequest.get('/me/verify', 'check verify')
	.authenticate()
	.expect(200, {
		verification: [
			{
				step: 3,
				state: 'pending',
				rejectreason: null,
				medias: [],
				provider: 'npoadmins',
			}
		],
		locked: true
	}));

chain.push(acceptVerification('npoadmins'));
chain.push(setAllowedAdminsVerify(["testadminautoafteradd_ms1@gmail.com", "testadminautoafteradd_ms2@gmail.com", "testadminautoafteradd_ms3@gmail.com"]));

chain.pushReq(TestRequest.get('/me/verify', 'check verify')
	.authenticate()
	.expect(200, {
		verification: [
			{
				step: 3,
				state: 'accepted',
				rejectreason: null,
				medias: [],
				provider: 'npoadmins',
			}
		],
		locked: true
	}));

chain.push(login);
chain.pushReq(TestRequest.get('/me/admin', 'check admins')
	.authenticate()
	.retry(10, 4)
	.expect(200, {
		admins: ["testadminautobeforeadd_ms1@gmail.com", "testadminautobeforeadd_ms2@gmail.com", "testadminautobeforeadd_ms3@gmail.com"]
	}));

chain.exec();
