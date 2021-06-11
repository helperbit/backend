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
	login, verifyFake, signup, hasBadge, hasLastBadge, checkToken
} from '../../tests.shared/middlewares/user';
import { TestChain } from '../../tests.shared/middlewares/frisby-chain';
import { TestRequest } from '../../tests.shared/middlewares/test-request';

let uid = null;

const chain = new TestChain('testuserbadge');
chain.pushData({ username: 'testuserbadge_badge' });
chain.push(signup);
chain.push(login);
chain.pushReq(TestRequest.get('/me', '')
	.authenticate()
	.expect(200)
	.expectJSONTypes({ badges: Array })
	.after((data, j) => {
		uid = j._id;
		return data;
	}));

/* Trust badge */
chain.push(verifyFake);
chain.push(hasBadge('trust'));
chain.pushReq(TestRequest.get('/user/testuserbadge_badge', 'badge list')
	.expect(200)
	.expectJSONTypes({ badges: Array })
	.expectJSON('badges.?', { code: 'trust' }));
chain.push(hasLastBadge('testuserbadge_badge', 'trust'));

/* Ambassador badge */
chain.pushChain((new TestChain())
	.pushData({ username: 'testuserbadge_mainrefb2', refby: 'testuserbadge_badge' })
	.push(signup)
	.push(login)
	.push(verifyFake)
	.push(hasBadge('friend'))
);
chain.pushChain((new TestChain())
	.pushData({ username: 'testuserbadge_mainrefb1', refby: 'testuserbadge_badge' })
	.push(signup)
	.push(login)
	.push(verifyFake)
	.push(hasBadge('friend'))
);

chain.push(hasBadge('friend'));
chain.push(hasBadge('ambassador-bronze'));
chain.push(hasLastBadge('testuserbadge_badge', 'ambassador-bronze'));

chain.exec();
