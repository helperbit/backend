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
const conf = require('../../../conf');

frisbyChain({ username: 'testusersingleuser_single' }, [
	common.cleanResources('testusersingleuser'),

	userMW.signup,
	userMW.login,
	userMW.checkToken,
	function (data, next) {
		frisby.create('/me - singleuser profile noauth')
			.get(common.api + 'me')
			.expectStatus(401).expectJSON({ error: 'E1' })
			.toss();

		frisby.create('/me - singleuser profile')
			.get(common.api + 'me')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				usertype: String,
				username: String,
				email: String,
				supportedevents: Array,
				policyversion: Object,
				bio: Object,
				country: String,
				zipcode: String,
				street: String,
				city: String,
				region: String,
				avatar: null,
				website: String,
				firstname: String,
				lastname: String,
				job: String,
				gender: String,
				donated: Number,
				donateddonations: Number,
				received: Number,
				receiveddonations: Number,
				receiveaddress: String
			})
			.expectJSON({
				usertype: "singleuser",
				username: "testusersingleuser_single",
				email: "testusersingleuser_single@gmail.com",
				policyversion: {
					terms: conf.policyversion.terms,
					privacy: conf.policyversion.privacy
				},
				supportedevents: [],
				bio: { en: '' },
				country: '',
				zipcode: '',
				street: '',
				city: '',
				region: '',
				avatar: null,
				website: '',
				location: { coordinates: [] },
				firstname: '',
				lastname: '',
				job: '',
				gender: 'a',
				donated: 0.0,
				donateddonations: 0,
				received: 0.0,
				receiveddonations: 0,
				receiveaddress: ''
			})
			.afterJSON(j => next(data))
			.toss();
	},
	userMW.uploadAvatar,
	function (data, next) {
		frisby.create('/me - singleuser profile edit policyversion with invalid version')
			.post(common.api + 'me', {
				firstname: "Gianni",
				lastname: "Giangiacomo",
				region: 'Sardegna',
				country: 'ITA',
				city: 'Quartu Sant Elena',
				publicfields: ["firstname"],
				policyversion: {
					terms: 12,
					privacy: 12
				}
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(function (json) {
				frisby.create('/me - singleuser profile mod')
					.get(common.api + 'me')
					.expectStatus(200)
					.addHeader('authorization', 'Bearer ' + data.token)
					.expectJSON({
						policyversion: {
							terms: conf.policyversion.terms,
							privacy: conf.policyversion.privacy
						}
					})
					.afterJSON(j => next(data))
					.toss();
			})
			.toss();
	},
	function (data, next) {
		frisby.create('/me - singleuser profile mod')
			.get(common.api + 'me')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				publicfields: ["firstname"],
				lastname: 'Giangiacomo',
				firstname: 'Gianni',
				country: 'ITA',
				region: 'Sardegna',
				avatar: data.avatarid
			})
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/user/:name - singleuser info retrieval')
			.get(common.api + 'user/testusersingleuser_single')
			.expectStatus(200)
			.expectJSON({
				username: "testusersingleuser_single",
				firstname: "Gianni",
				lastname: undefined,
				country: 'ITA',
				location: undefined
			})
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me - singleuser profile edit')
			.post(common.api + 'me', {
				publicfields: ["lastname"]
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me - singleuser profile mod')
			.get(common.api + 'me')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				publicfields: ["lastname"],
				lastname: 'Giangiacomo',
				firstname: 'Gianni',
				country: 'ITA',
				region: 'Sardegna',
			})
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/user/:name - singleuser info retrieval')
			.get(common.api + 'user/testusersingleuser_single')
			.expectStatus(200)
			.expectJSON({
				username: "testusersingleuser_single",
				firstname: undefined,
				lastname: "Giangiacomo",
				country: 'ITA',
				location: undefined
			})
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(500)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				error: 'EV1',
				data: {
					fields: [
						'gender', 'birthdate', 'street', 'streetnr', 'zipcode', 'location'
					]
				}
			})
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me - company profile edit and missing fields')
			.post(common.api + 'me', {
				street: 'via dei conversi',
				streetnr: '130',
				zipcode: '09136',
				country: 'ITA',
				city: 'Cagliari',
				gender: 'm',
				birthdate: new Date(1990, 12, 11),
				location: { coordinates: [9.14, 39.218], type: 'Point' }
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: 9,
				available: ['document', 'residency']
			})
			.afterJSON(j => next(data))
			.toss();
	},
	common.cleanResources('testusersingleuser')
]);
