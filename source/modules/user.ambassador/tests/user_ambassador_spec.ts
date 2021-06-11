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

let uid = null;
let refcode = null;

frisbyChain({ username: 'testuserambassador_maintop' }, [
	common.cleanResources('testuserambassador'),

	userMW.signup,
	userMW.login,
	(data, next) => frisby.create('/me')
		.get(common.api + 'me')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSONTypes({ refcode: Number, _id: String })
		.afterJSON(json => {
			uid = json._id;
			refcode = json.refcode;
			next(data);
		})
		.toss(),

	/* By refcode */
	(data2, next2) => frisbyChain({ username: 'testuserambassador_mainref', refby: refcode }, [
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		userMW.verifyFake,
		(data, next) => frisby.create('/me')
			.get(common.api + 'me')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: (v => v > 25)
			})
			.afterJSON(j => next(data))
			.toss(),
		(data) => frisby.create('/me/ambassador - get referred users')
			.get(common.api + 'me/ambassador')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				refby: String
			})
			.expectJSON({
				count: 0,
				refby: 'testuserambassador_maintop'
			})
			.afterJSON(j => next2(data2))
			.toss()
	]),

	(data2, next2) => frisbyChain({ username: 'testuserambassador_maintop', password: 'testuserambassador_maintop' }, [
		userMW.login,
		userMW.checkToken,
		(data) => frisby.create('/me/ambassador - get referred users')
			.get(common.api + 'me/ambassador')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				referred: Array,
				count: Number,
			})
			.expectJSONTypes('referred.*', {
				regdate: Date,
				verified: Boolean
			})
			.expectJSON('referred.*', {
				verified: true
			})
			.expectJSON({
				count: 1
			})
			.afterJSON(j => next2(data2))
			.toss()
	]),

	/* By name */
	(data2, next2) => frisbyChain({ username: 'testuserambassador_mainref1', refby: 'testuserambassador_maintop' }, [
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		userMW.verifyFake,
		(data, next) => frisby.create('/me')
			.get(common.api + 'me')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: (v => v > 25)
			})
			.afterJSON(j => next(data))
			.toss(),
		(data) => frisby.create('/me/ambassador - get referred users')
			.get(common.api + 'me/ambassador')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				refby: String
			})
			.expectJSON({
				count: 0,
				refby: 'testuserambassador_maintop'
			})
			.afterJSON(j => next2(data2))
			.toss()
	]),

	(data2, next2) => frisbyChain({ username: 'testuserambassador_maintop', password: 'testuserambassador_maintop' }, [
		userMW.login,
		userMW.checkToken,
		(data) => frisby.create('/me/ambassador - get referred users')
			.get(common.api + 'me/ambassador')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				referred: Array,
				count: Number,
			})
			.expectJSONTypes('referred.*', {
				regdate: Date,
				verified: Boolean
			})
			.expectJSON('referred.*', {
				verified: true
			})
			.expectJSON({
				count: 2
			})
			.afterJSON(j => next2(data2))
			.toss()
	]),

	/* By id */
	(data, next2) => frisbyChain({ username: 'testuserambassador_mainref2', refby: uid }, [
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		(data) => frisby.create('/me/ambassador - get referred users')
			.get(common.api + 'me/ambassador')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				referred: Array,
				count: Number,
				refby: String
			})
			.afterJSON(j => next2(data))
			.toss()
	]),

	/* Check users and merchandise */
	(data2, next2) => frisbyChain({ username: 'testuserambassador_maintop', password: 'testuserambassador_maintop' }, [
		userMW.login,
		userMW.checkToken,
		(data, next) => frisby.create('/me/ambassador - get referred users')
			.get(common.api + 'me/ambassador')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				referred: Array,
				count: Number,
			})
			.expectJSONTypes('referred.*', {
				regdate: Date,
				verified: Boolean
			})
			.expectJSON({
				count: 2,
				refby: null
			})
			.expectJSON('referred', [
				{ verified: true },
				{ verified: true },
				{ verified: false }
			])
			.afterJSON(j => next(data))
			.toss(),

		(data, next) => frisby.create('/stats/merchandise - get merchandise (logged)')
			.get(common.api + 'stats/merchandise')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				merchandise: Array
			})
			.expectJSONTypes('merchandise.*', {
				assigned: Number,
				name: String,
				time: Date,
				total: Number,
				minrefs: Number
			})
			.expectJSON('merchandise.*', {
				total: 21
			})
			.afterJSON(j => next2(data2))
			.toss()
	]),

	/* Subscribe other 4 verified users */
	(data, next) => frisbyChain({ username: 'testuserambassador_mainref3', refby: refcode }, [
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		userMW.verifyFake,
		d => next(data)
	]),
	(data, next) => frisbyChain({ username: 'testuserambassador_mainref4', refby: refcode }, [
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		userMW.verifyFake,
		d => next(data)
	]),
	(data, next) => frisbyChain({ username: 'testuserambassador_mainref5', refby: refcode }, [
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		userMW.verifyFake,
		d => next(data)
	]),
	(data, next) => frisbyChain({ username: 'testuserambassador_mainref6', refby: refcode }, [
		userMW.signup,
		userMW.login,
		userMW.checkToken,
		userMW.verifyFake,
		d => next(data)
	]),

	/* Check users and merchandise */
	(data2, next2) => frisbyChain({ username: 'testuserambassador_maintop', password: 'testuserambassador_maintop' }, [
		userMW.login,
		userMW.checkToken,
		(data, next) => frisby.create('/me/ambassador - get referred users')
			.get(common.api + 'me/ambassador')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				referred: Array,
				count: Number,
			})
			.expectJSONTypes('referred.*', {
				regdate: Date,
				verified: Boolean
			})
			.expectJSON({
				count: 6,
				refby: null
			})
			.expectJSON('referred', [
				{ verified: true },
				{ verified: true },
				{ verified: false },
				{ verified: true },
				{ verified: true },
				{ verified: true },
				{ verified: true }
			])
			.afterJSON(j => next(data))
			.toss(),

		userMW.hasNotification('50'),

		(data, next) => frisby.create('/stats/merchandise - get merchandise (logged)')
			.get(common.api + 'stats/merchandise')
			.expectStatus(200)
			.retry(50, 5000)
			.waits(5000)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSONTypes({
				merchandise: Array
			})
			.expectJSONTypes('merchandise.*', {
				assigned: Number,
				name: String,
				time: Date,
				total: Number,
				minrefs: Number
			})
			.expectJSON('merchandise.*', {
				total: 21
			})
			.expectJSON('merchandise.?', {
				assigned: 1,
				assignment: {
					username: 'testuserambassador_maintop',
					status: 'assigned'
				}
			})
			.afterJSON(j => next2(data2))
			.toss()
	]),
	common.cleanResources('testuserambassador')
]);
