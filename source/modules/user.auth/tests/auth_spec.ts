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

import { TestChain } from '../../tests.shared/middlewares/frisby-chain';
import { TestRequest } from '../../tests.shared/middlewares/test-request';

const chain = new TestChain('testauth');

chain.pushReq(TestRequest.post('/signup', 'create account', {
	username: 'testauth1',
	email: 'testauth1@gmail.com',
	password: 'testauth1',
	terms: true,
	newsletter: false,
	usertype: 'singleuser'
}).expect(200));

chain.pushReq(TestRequest.post('/signup', 'ES1 username already taken', {
	username: 'testauth1',
	email: 'testauth2@gmail.com',
	password: 'testauth1',
	terms: true,
	newsletter: false,
	usertype: 'singleuser'
}).expect(500, { error: 'ES1' }));

chain.pushReq(TestRequest.post('/signup', 'ES5 disposable email domain', {
	username: 'testauth199',
	email: 'testauth2@0-mail.com',
	password: 'testauth199',
	terms: true,
	newsletter: false,
	usertype: 'singleuser'
}).expect(500, { error: 'ES5' }));

chain.pushReq(TestRequest.post('/signup', 'ES7 username too long', {
	username: 'testauthtestauthtestauthtestauthtestauthtestauthtestauthtestauth',
	email: 'testauth4@gmail.com',
	password: 'testauth1',
	terms: true,
	newsletter: false,
	usertype: 'singleuser'
}).expect(500, { error: 'E3', data: { name: 'username' } }));

chain.pushReq(TestRequest.post('/signup', 'ES8 invalid username', {
	username: 'fri@@',
	email: 'testauth4@gmail.com',
	password: 'testauth1',
	terms: true,
	newsletter: false,
	usertype: 'singleuser'
}).expect(500, { error: 'E3', data: { name: 'username' } }));

chain.pushReq(TestRequest.post('/signup', 'ES6 terms not accepted', {
	username: 'testauth3',
	email: 'testauth3@gmail.com',
	password: 'testauth3',
	terms: false,
	newsletter: false,
	usertype: 'singleuser'
}).expect(500, { error: 'E3', data: { name: 'terms' } }));

chain.pushReq(TestRequest.post('/signup', 'ES2 email already taken', {
	username: 'testauth2',
	email: 'testauth1@gmail.com',
	password: 'testauth1',
	terms: true,
	newsletter: false,
	usertype: 'singleuser'
}).expect(500, { error: 'ES2' }));

chain.pushReq(TestRequest.post('/signup', 'ES3 invalid email', {
	username: 'testauth2',
	email: 'testauth1INVALID!!',
	password: 'testauth1',
	terms: true,
	newsletter: false,
	usertype: 'singleuser'
}).expect(500, { error: 'E3', data: { name: 'email' } }));


chain.pushReq(TestRequest.post('/signup', 'ES5 short username', {
	username: 'fri',
	email: 'testauth5@gmail.com',
	password: 'testauth1',
	terms: true,
	newsletter: false,
	usertype: 'singleuser'
}).expect(500, { error: 'E3', data: { name: 'username' } }));


chain.pushReq(TestRequest.post('/login', 'correct login', {
	user: 'testauth1@gmail.com',
	password: 'testauth1'
}).expect(200, { username: "testauth1" }, {
	token: String,
	username: String,
	expiration: Number
}).after((data, j) => {
	data.token = j.token;
	return data;
}));

chain.pushReq(TestRequest.get('/auth/state', 'check fine')
	.authenticate()
	.expect(200, { auth: "ok", username: "testauth1" }));

chain.pushReq(TestRequest.get('/auth/state', 'check E1')
	.expect(200, { auth: "none" }));

chain.pushReq(TestRequest.post('/login', 'incorrect login mail', {
	user: 'testauth1INVALID@gmail.com',
	password: 'testauth1',
}).expect(401, { error: "EL1" }));

chain.pushReq(TestRequest.post('/login', 'incorrect login password', {
	user: 'testauth1@gmail.com',
	password: 'testauth1INVALID',
}).expect(401, { error: "EL1" }));

chain.exec();
