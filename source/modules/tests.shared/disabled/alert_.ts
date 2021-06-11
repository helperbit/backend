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
const common = require('.../../tests.shared/middlewares/common');
const userMW = require('.../../tests.shared/middlewares/user');
const frisbyChain = require('.../../tests.shared/middlewares/frisbyChain').default;

frisbyChain({ username: 'testalert_alert1' }, [
	common.cleanResources('testalert'),
	userMW.signup,
	userMW.login,
	userMW.checkToken,

	/* Errors */
	function (data, next) {
		frisby.create('/me/alert - insert alert E1')
			.post(common.api + 'me/alert')
			.expectStatus(401).expectJSON({ error: 'E1' })
			.toss();

		frisby.create('/me/alert - insert alert EAL2')
			.post(common.api + 'me/alert', { type: 'earthquake' }, { json: true })
			.expectStatus(500).expectJSON({ error: 'EAL2' })
			.addHeader('authorization', 'Bearer ' + data.token)
			.toss();
		next(data);
	},

	/* Geolocalize */
	userMW.geolocalizeAsAffected,

	/* Errors and fine insertion */
	function (data, next) {
		frisby.create('/me/alert - insert alert E3')
			.post(common.api + 'me/alert')
			.expectStatus(500).expectJSON({ error: 'E3' })
			.addHeader('authorization', 'Bearer ' + data.token)
			.toss();

		frisby.create('/me/alert - insert alert fine')
			.post(common.api + 'me/alert', { type: 'earthquake', description: 'catapulta!!!!' }, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(function (json) { next(data); })
			.toss();
	},
	function (data, next) {
		frisby.create('/me/alert - insert alert EAL1')
			.post(common.api + 'me/alert', { type: 'earthquake', description: 'catapulta!!!!' }, { json: true })
			.expectStatus(500).expectJSON({ error: 'EAL1' })
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(function (json) { next(data); })
			.toss();
	},

	/* Check inserted alert, getlist */
	function (data, next) {
		frisby.create('/me/alerts - get alert list')
			.get(common.api + 'me/alerts')
			.expectStatus(200)
			.expectJSONTypes({ alerts: Array })
			.expectJSONTypes('alerts.*', {
				description: String,
				type: String,
				time: String
			})
			.expectJSON({
				alerts: [
					{ type: 'earthquake', description: 'catapulta!!!!' }
				]
			})
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(j => {
				return next(data);
			})
			.toss();
	},
	common.cleanResources('testalert'),
]);
