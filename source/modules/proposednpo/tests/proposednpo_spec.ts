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

import { signup, login } from '../../tests.shared/middlewares/user';
import { TestChain } from '../../tests.shared/middlewares/frisby-chain';
import { TestRequest } from '../../tests.shared/middlewares/test-request';


const chain = new TestChain('testproposed');

/* Not logged */
chain.pushReq(TestRequest.post('/proposednpo/insert', 'Insert a proposed NPO E3', {})
	.expect(401, { error: 'E1' }));

chain.pushReq(TestRequest.post('/proposednpo/insert', 'Insert a proposed NPO E3', {
	name: 'testproposed1',
	link: 'http://www.google.com'
}).expect(401, { error: 'E1' }));


/* Logged */
chain.pushData({ username: 'testproposed_mwnpo', usertype: 'singleuser' });
chain.push(signup);
chain.push(login);
chain.pushReq(TestRequest.post('/proposednpo/insert', 'Insert a proposed NPO logged E3', {})
	.authenticate()
	.expect(500, { error: 'E3' }));

chain.pushReq(TestRequest.post('/proposednpo/insert', 'Insert a proposed NPO', {
	name: 'testproposed1',
	link: 'http://www.google.com'
}).authenticate().expect(200));

chain.pushReq(TestRequest.post('/proposednpo/insert', 'Insert a proposed NPO', {
	name: 'testproposed1',
	link: 'http://www.google.com'
}).authenticate().expect(500, { error: 'EMWN3' }));

chain.pushReq(TestRequest.post('/proposednpo/insert', 'Insert a proposed NPO', {
	name: 'testproposed2',
	link: 'http://www.google.com'
}).authenticate().expect(200));

chain.exec();
