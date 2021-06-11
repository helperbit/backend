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
import userMW = require('../../tests.shared/middlewares/user');
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';

frisbyChain({ username: 'testuseradmin_single_admin2' }, [
	common.cleanResources('testuseradmin'),
	userMW.signup,
	(data, next) => next({ username: 'testuseradmin_single_admin' }),
	userMW.signup,
	userMW.login,
	userMW.verifyFake,
	function (data, next) {
		frisby.create('/me/admin/add - npo admin add on single user')
			.post(common.api + 'me/admin/add', {
				email: "testuseradmin_single_admin2@gmail.com"
			}, { json: true })
			.expectStatus(401)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({ error: String })
			.expectJSON({ error: 'E6' })
			.afterJSON(j => next(data))
			.toss();
	},
	function(data, next) { next({ username: 'testuseradmin_npo_admin', usertype: 'npo' }) },
	userMW.signup,
	userMW.login,
	userMW.verifyFake,
	function (data, next) {
		frisby.create('/me/admin - npo admin list empty')
			.get(common.api + 'me/admin')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({ admins: Array })
			.expectJSON({ admins: [] })
			.toss();

		userMW.setAllowedAdmins(data.username, ["testuseradmin_single_admin@gmail.com"]);

		frisby.create('/me/admin/add - npo admin add')
			.post(common.api + 'me/admin/add', {
				email: "testuseradmin_single_admin@gmail.com"
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/admin - npo admin list populated')
			.get(common.api + 'me/admin')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({ admins: Array })
			.expectJSON({ admins: ["testuseradmin_single_admin@gmail.com"] })
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/admin - npo admin remove')
			.post(common.api + 'me/admin/remove', {
				email: "testuseradmin_single_admin@gmail.com"
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/admin - npo admin list empty')
			.get(common.api + 'me/admin')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({ admins: Array })
			.expectJSON({ admins: [] })
			.afterJSON(j => next(data))
			.toss();
	},
	common.cleanResources('testuseradmin')
]);
