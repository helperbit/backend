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

frisbyChain({ username: 'testusernpo_npo', usertype: 'npo' }, [
	common.cleanResources('testusernpo'),

	userMW.signup,
	userMW.login,
	userMW.checkToken,
	function (data, next) {
		frisby.create('/me - npo profile noauth')
			.get(common.api + 'me')
			.expectStatus(401).expectJSON({ error: 'E1' })
			.toss();

		frisby.create('/me - npo profile')
			.get(common.api + 'me')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				usertype: String,
				username: String,
				email: String,
				supportedevents: Array,
				bio: Object,
				country: String,
				zipcode: String,
				street: String,
				city: String,
				region: String,
				avatar: null,
				website: String,
				donated: Number,
				donateddonations: Number,
				received: Number,
				receiveddonations: Number,
				receiveaddress: String,
				tags: Array,
				referent: Object
			})
			.expectJSON({
				usertype: "npo",
				username: "testusernpo_npo",
				email: "testusernpo_npo@gmail.com",
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
				donated: 0.0,
				donateddonations: 0,
				received: 0.0,
				receiveddonations: 0,
				receiveaddress: '',
				tags: [],
				referent: {
					firstname: '',
					lastname: '',
					idnumber: '',
					email: ''
				}
			})
			.afterJSON(j => next(data))
			.toss();
	},
	userMW.uploadAvatar,
	userMW.uploadCover,
	function (data, next) {
		frisby.create('/me - npo profile edit: tags field')
			.post(common.api + 'me', {
				fullname: "npo test",
				operators: "250-1000"
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(function (json) {
				frisby.create('/me - npo profile')
					.get(common.api + 'me')
					.expectStatus(200)
					.addHeader('authorization', 'Bearer ' + data.token)
					.expectJSON({
						fullname: "npo test",
						operators: "250-1000",
						avatar: data.avatarid,
						photo: data.photoid
					})
					.afterJSON(j => next(data))
					.toss();
			}).toss();
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
						'countries',
						'website',
						'birthdate',
						'tags',
						'vat',
						'referent.firstname',
						'referent.lastname',
						'referent.email',
						'referent.idnumber',
						'city',
						'country',
						'street',
						'streetnr',
						'zipcode',
						'location'
					]
				}
			})
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me - npo profile edit: tags field')
			.post(common.api + 'me', {
				tags: ['education', 'nondevecomparire']
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(function (json) {
				frisby.create('/me - npo profile: tags field match')
					.get(common.api + 'me')
					.expectStatus(200)
					.addHeader('authorization', 'Bearer ' + data.token)
					.expectJSONTypes({
						tags: Array
					})
					.expectJSON({
						tags: ['education']
					})
					.afterJSON(j => next(data))
					.toss();
			})
			.toss();
	},
	function (data, next) {
		frisby.create('/me - npo profile edit and missing fields')
			.post(common.api + 'me', {
				website: "www.gianni.com",
				street: 'via dei conversi',
				countries: ['ITA'],
				streetnr: '130',
				zipcode: '09136',
				country: 'ITA',
				city: 'Cagliari',
				region: 'Sardegna',
				location: { coordinates: [9.14, 39.218], type: 'Point' },
				birthdate: new Date(1990, 12, 11),
				referent: {
					firstname: "Davide",
					lastname: "Gessa",
					email: "dak.linux@gmail.com",
					idnumber: "AX14324234"
				}
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
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
						'vat'
					]
				}
			})
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me - npo profile edit and missing fields')
			.post(common.api + 'me', {
				vat: "13424",
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
				available: [ 'npoadmins', 'npostatute', 'npomemorandum', 'otc' ]
			})
			.afterJSON(j => next(data))
			.toss();
	},
	common.cleanResources('testusernpo')
]);
