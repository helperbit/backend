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

import { signup, login, checkToken, setBan } from '../../tests.shared/middlewares/user';
import { TestChain } from '../../tests.shared/middlewares/frisby-chain';
import { TestRequest } from '../../tests.shared/middlewares/test-request';

const chain = new TestChain('testuserban');

chain.pushData({ username: 'testuserban_single' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);
chain.push((data, next) => {
	setBan('testuserban_single', true);
	next(data);
});

chain.pushReq(TestRequest.get('/user/testuserban_single', 'singleuser banned info retrieval')
	.expect(404, { error: 'E2' }));

chain.pushReq(TestRequest.post('/login', 'banned login', (data) => ({
	user: data.username,
	password: data.password,
	language: data.language || undefined,
})).expect(500, { error: 'EA5' }));

chain.push((data, next) => {
	setBan('testuserban_single', false);
	next(data);
});

chain.push(login);
chain.push(checkToken);

chain.exec();
