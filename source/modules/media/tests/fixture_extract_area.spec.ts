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

const files = [
	"test.png",
	"test.jpg",
	"test2.png"
];

const chain = new TestChain('testmediaextractarea');

chain.pushData({ username: 'testmediaextractarea_single' });
chain.push(signup);
chain.push(login);
chain.push(checkToken);

for (const f of files) {
	chain.pushReq(TestRequest.postFile('/me/media/avatar', 'Uploading avatar ' + f, f)
		.authenticate().expect(200));
	chain.pushReq(TestRequest.postFile('/me/media/photo', 'Uploading cover ' + f, f)
		.authenticate().expect(200));
}

chain.exec();
