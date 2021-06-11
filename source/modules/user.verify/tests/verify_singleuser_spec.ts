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
import { login, signup, checkToken, acceptVerification,
	inprogressVerification, setOTCCode } from '../../tests.shared/middlewares/user';
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';
const formdata = require('form-data');
const fs = require('fs');

frisbyChain({ username: 'testverifysingleuser_single' }, [
	common.cleanResources('testverifysingleuser'),
	signup,
	login,
	checkToken,
	(data, next) => frisby.create('/me/verify - check verify')
		.get(common.api + 'me/verify')
		.expectStatus(500)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({
			error: 'EV1',
			data: {
				mandatoryfields: [
					'firstname',
					'lastname',
					'gender',
					'birthdate',
					'city',
					'country',
					'street',
					'streetnr',
					'zipcode',
					'location'
				],
				fields: [
					'firstname',
					'lastname',
					'gender',
					'birthdate',
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
		.toss(),

	(data, next) => frisby.create('/me/edit - complete profile')
		.post(common.api + 'me', {
			firstname: 'Davide',
			lastname: 'Gessa',
			street: 'via dei conversi',
			gender: 'm',
			streetnr: '130',
			zipcode: '09136',
			country: 'ITA',
			city: 'Cagliari',
			birthdate: new Date(1990, 12, 11),
			location: { coordinates: [9.14, 39.218], type: 'Point' }
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/me/verify - check verify')
		.get(common.api + 'me/verify')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({
			mandatoryfields: [
				'firstname',
				'lastname',
				'gender',
				'birthdate',
				'city',
				'country',
				'street',
				'streetnr',
				'zipcode',
				'location'
			],
			trustlevel: 8,
			available: ['document', 'residency', 'gps'],
			verification: [],
			locked: false
		})
		.afterJSON(j => next(data))
		.toss(),

	/* GPS Verification */
	(data, next) => frisby.create('/me/verify/gps/step/0 - wrong gps verification')
		.post(common.api + 'me/verify/gps/step/0', {
			lat: 39.218,
			lon: 1.14
		}, { json: true })
		.expectStatus(500)
		.expectJSON({
			error: 'EV5'
		})
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/me/verify/gps/step/0 - gps verification')
		.post(common.api + 'me/verify/gps/step/0', {
			lat: 39.218,
			lon: 9.14
		}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/me/verify - check verify')
		.get(common.api + 'me/verify')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({
			trustlevel: 13,
			available: ['document', 'residency'],
			verification: [
				{
					step: 1,
					state: 'accepted',
					rejectreason: null,
					medias: [],
					provider: 'gps',
				}
			],
			locked: true
		})
		.afterJSON(j => next(data))
		.toss(),


	/* Residency Verification */
	(data, next) => {
		const form = new formdata();
		form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
			knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
		});

		frisby.create('/me/verify/residency/step/0')
			.post(common.api + 'me/verify/residency/step/0', form, { json: false })
			.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
			.addHeader('authorization', 'Bearer ' + data.token)
			.addHeader('content-length', form.getLengthSync())
			.expectStatus(200)
			.afterJSON(j => next(data))
			.toss();
	},
	(data, next) => frisby.create('/me/verify - check verify')
		.get(common.api + 'me/verify')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({
			trustlevel: 13,
			available: ['document', 'residency'],
			verification: [
				{
					step: 1,
					state: 'accepted',
					rejectreason: null,
					medias: [],
					provider: 'gps',
				},
				{
					step: 1,
					state: 'pending',
					rejectreason: null,
					medias: [],
					provider: 'residency',
				}
			],
			locked: true
		})
		.afterJSON(j => next(data))
		.toss(),

	acceptVerification('residency'),
	(data, next) => frisby.create('/me/verify - check verify')
		.get(common.api + 'me/verify')
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({
			trustlevel: 28,
			available: ['document'],
			verification: [
				{
					step: 1,
					state: 'accepted',
					rejectreason: null,
					medias: [],
					provider: 'gps',
				},
				{
					step: 1,
					state: 'accepted',
					rejectreason: null,
					medias: [],
					provider: 'residency',
				}
			],
			locked: true
		})
		.afterJSON(j => next(data))
		.toss(),

	/* Document Verification */
	function (data, next) {
		frisby.create('/me/verify/document/step/0')
			.post(common.api + 'me/verify/document/step/0', {
				document: "id",
				expirationdate: "2021-12-12",
				documentid: "AX234234"
			})
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.afterJSON(function (json) {
				const form = new formdata();
				form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
					knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
				});
				form.append('name', 'back');

				frisby.create('/me/verify/document/step/1')
					.post(common.api + 'me/verify/document/step/1', form, { json: false })
					.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
					.addHeader('authorization', 'Bearer ' + data.token)
					.addHeader('content-length', form.getLengthSync())
					.expectStatus(200)
					.afterJSON(function (json) {
						const form = new formdata();
						form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
							knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
						});
						form.append('name', 'front');

						frisby.create('/me/verify/document/step/1')
							.post(common.api + 'me/verify/document/step/1', form, { json: false })
							.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
							.addHeader('authorization', 'Bearer ' + data.token)
							.addHeader('content-length', form.getLengthSync())
							.expectStatus(200)
							.afterJSON(function (json) {
								frisby.create('/me/verify/document/step/2')
									.post(common.api + 'me/verify/document/step/2', {})
									.addHeader('authorization', 'Bearer ' + data.token)
									.expectStatus(200)
									.afterJSON(j => next(data))
									.toss();
							})
							.toss();
					})
					.toss();
			})
			.toss();
	},
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: 28,
				available: ['document'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'gps',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'residency',
					},
					{
						step: 2,
						state: 'pending',
						rejectreason: null,
						medias: [],
						provider: 'document',
					}
				],
				locked: true
			})
			.afterJSON(j => next(data))
			.toss();
	},
	acceptVerification('document'),
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: 53,
				available: ['otc'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'gps',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'residency',
					},
					{
						step: 2,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'document',
					}
				],
				locked: true
			})
			.afterJSON(j => next(data))
			.toss();
	},
	/* OTC Verify */
	function (data, next) {
		frisby.create('/me/verify/otc/step/0 - otc verification')
			.post(common.api + 'me/verify/otc/step/0', {
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
				trustlevel: 53,
				available: ['otc'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'gps',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'residency',
					},
					{
						step: 2,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'document',
					},
					{
						step: 1,
						state: 'pending',
						rejectreason: null,
						medias: [],
						provider: 'otc',
					}
				],
				locked: true
			})
			.afterJSON(j => next(data))
			.toss();
	},
	inprogressVerification('otc'),
	setOTCCode('123'),
	function (data, next) {
		frisby.create('/me/verify/otc/step/1 - otc verification')
			.post(common.api + 'me/verify/otc/step/1', {
				otc: '123'
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
				trustlevel: 68,
				available: [],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'gps',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'residency',
					},
					{
						step: 2,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'document',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'otc',
					}
				],
				locked: true
			})
			.afterJSON(j => next(data))
			.toss();
	},
	common.cleanResources('testverifysingleuser')
]);
