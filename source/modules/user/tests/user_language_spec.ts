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

import { signup, login, checkToken } from '../../tests.shared/middlewares/user';
import { TestChain } from '../../tests.shared/middlewares/frisby-chain';
import { TestRequest } from '../../tests.shared/middlewares/test-request';

const chain = new TestChain('testuserlanguage');
chain.pushData({ username: 'testuserlanguage_single', language: 'it' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);
chain.pushReq(TestRequest.get('/me', 'singleuser profile')
	.authenticate()
	.expect(200, { language: 'it' }, { language: String }));

chain.pushReq(TestRequest.post('/me', 'singleuser change language', { language: 'en' })
	.authenticate().expect(200));

chain.pushReq(TestRequest.get('/me', 'singleuser profile')
	.authenticate()
	.expect(200, { language: 'en' }, { language: String }));

chain.push(login);

chain.pushReq(TestRequest.get('/me', 'singleuser profile')
	.authenticate()
	.expect(200, { language: 'it' }, { language: String }));

chain.pushData({ username: 'testuserlanguage_single2', language: 'es' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);
chain.pushReq(TestRequest.get('/me', 'singleuser profile')
	.authenticate()
	.expect(200, { language: 'es' }, { language: String }));

chain.exec();
