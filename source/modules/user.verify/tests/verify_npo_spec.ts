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
	inprogressVerification, setOTCCode, setAllowedAdminsVerify } from '../../tests.shared/middlewares/user';
import { frisbyChain } from '../../tests.shared/middlewares/frisby-chain';
const formdata = require('form-data');
const fs = require('fs');

frisbyChain({ username: 'testverifynpo_npo', usertype: 'npo' }, [
	common.cleanResources('testverifynpo'),
	signup,
	login,
	checkToken,
	function (data, next) {
		frisby.create('/me/verify - check verify (1)')
			.get(common.api + 'me/verify')
			.expectStatus(500)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				error: 'EV1',
				data: {
					mandatoryfields: [
						'fullname',
						'countries',
						'website',
						'birthdate',
						'operators',
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
					],
					fields: [
						// 'fullname',
						'countries',
						'website',
						'operators',
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
		frisby.create('/me/edit - complete profile')
			.post(common.api + 'me', {
				fullname: 'Davide Gessa NOPROF',
				contries: ['ITA'],
				tags: ["education"],
				vat: "1234324",
				operators: '2-10',
				street: 'via dei conversi',
				referent: {
					firstname: "Gianni",
					lastname: "Culo",
					idnumber: "AX3424",
					email: "frisby@gmail.com"
				},
				streetnr: '130',
				zipcode: '09136',
				country: 'ITA',
				city: 'Cagliari',
				website: 'davidegessa.wordpress.com',
				birthdate: new Date(1990, 12, 11),
				location: { coordinates: [9.14, 39.218], type: 'Point' }
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/verify - check verify (2)')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				mandatoryfields: [
					'fullname',
					'countries',
					'website',
					'birthdate',
					'operators',
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
				],
				trustlevel: 8,
				available: ['npoadmins', 'npostatute', 'npomemorandum', 'otc'],
				verification: [],
				locked: false
			})
			.afterJSON(j => next(data))
			.toss();
	},


	/* NPO statute Verification */
	function (data, next) {
		const form = new formdata();
		form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
			knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
		});

		frisby.create('/me/verify/npostatute/step/0')
			.post(common.api + 'me/verify/npostatute/step/0', form, { json: false })
			.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
			.addHeader('authorization', 'Bearer ' + data.token)
			.addHeader('content-length', form.getLengthSync())
			.expectStatus(200)
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: 8,
				available: ['npoadmins', 'npostatute', 'npomemorandum', 'otc'],
				verification: [
					{
						step: 1,
						state: 'pending',
						rejectreason: null,
						medias: [],
						provider: 'npostatute',
					}
				],
				locked: false
			})
			.afterJSON(j => next(data))
			.toss();
	},
	acceptVerification('npostatute'),
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: 28,
				available: ['npoadmins', 'npomemorandum', 'otc'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npostatute',
					}
				],
				locked: true
			})
			.afterJSON(j => next(data))
			.toss();
	},


	/* NPO memorandum Verification */
	function (data, next) {
		const form = new formdata();
		form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
			knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
		});

		frisby.create('/me/verify/npomemorandum/step/0')
			.post(common.api + 'me/verify/npomemorandum/step/0', form, { json: false })
			.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
			.addHeader('authorization', 'Bearer ' + data.token)
			.addHeader('content-length', form.getLengthSync())
			.expectStatus(200)
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: 28,
				available: ['npoadmins', 'npomemorandum', 'otc'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npostatute',
					},
					{
						step: 1,
						state: 'pending',
						rejectreason: null,
						medias: [],
						provider: 'npomemorandum',
					}
				],
				locked: true
			})
			.afterJSON(j => next(data))
			.toss();
	},
	acceptVerification('npomemorandum'),
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: 53,
				available: ['npoadmins', 'otc'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npostatute',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npomemorandum',
					}
				],
				locked: true
			})
			.afterJSON(j => next(data))
			.toss();
	},


	/* NPO Admins Verification */
	function (data, next) {
		frisby.create('/me/verify/npoadmins/step/0 fail: no 3 admins')
			.post(common.api + 'me/verify/npoadmins/step/0', {
				admins: [
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "giannipino@gmail.com",
						idnumber: "AX4535435"
					}
				]
			}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(500)
			.expectJSON({ error: 'E3' })
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/verify/npoadmins/step/0 fail: malformed admin')
			.post(common.api + 'me/verify/npoadmins/step/0', {
				admins: [
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "giannipino@gmail.com",
						idnumber: "AX4535435"
					},
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "",
						idnumber: "AX4535435"
					},
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "giannispino@gmail.com",
						idnumber: "AX4535435"
					}
				]
			}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(500)
			.expectJSON({ error: 'E3' })
			.afterJSON(j => next(data))
			.toss();
	},
	function (data, next) {
		frisby.create('/me/verify/npoadmins/step/0 fail: equals email')
			.post(common.api + 'me/verify/npoadmins/step/0', {
				admins: [
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "giannipino@gmail.com",
						idnumber: "AX4535435"
					},
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "giannipino@gmail.com",
						idnumber: "AX4535435"
					},
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "giannispino@gmail.com",
						idnumber: "AX4535435"
					}
				]
			}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(500)
			.expectJSON({ error: 'E3' })
			.afterJSON(j => next(data))
			.toss();
	},

	function (data, next) {
		frisby.create('/me/verify/npoadmins/step/0')
			.post(common.api + 'me/verify/npoadmins/step/0', {
				admins: [
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "testverifynpo_ms1@gmail.com",
						idnumber: "AX4535435"
					},
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "testverifynpo_ms2@gmail.com",
						idnumber: "AX4535435"
					},
					{
						firstname: "Gianni",
						lastname: "Pinolo",
						email: "testverifynpo_ms3@gmail.com",
						idnumber: "AX4535435"
					}
				]
			}, { json: true })
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.afterJSON(function (json) {
				const form = new formdata();
				form.append('file', fs.createReadStream('source/modules/tests.shared/data/test.png'), {
					knownLength: fs.statSync('source/modules/tests.shared/data/test.png').size
				});

				frisby.create('/me/verify/npoadmins/step/1')
					.post(common.api + 'me/verify/npoadmins/step/1', form, { json: false })
					.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
					.addHeader('authorization', 'Bearer ' + data.token)
					.addHeader('content-length', form.getLengthSync())
					.expectStatus(200)
					.afterJSON(function (json) {
						frisby.create('/me/verify/npoadmins/step/2')
							.post(common.api + 'me/verify/npoadmins/step/2', {})
							.addHeader('authorization', 'Bearer ' + data.token)
							.expectStatus(200)
							.afterJSON(j => next(data))
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
				trustlevel: 53,
				available: ['npoadmins', 'otc'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npostatute',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npomemorandum',
					},
					{
						step: 3,
						state: 'pending',
						rejectreason: null,
						medias: [],
						provider: 'npoadmins',
					}
				],
				locked: true
			})
			.afterJSON(j => next(data))
			.toss();
	},
	acceptVerification('npoadmins'),
	setAllowedAdminsVerify(["testverifynpo_ms1@gmail.com", "testverifynpo_ms2@gmail.com", "testverifynpo_ms3@gmail.com"]),
	function (data, next) {
		frisby.create('/me/verify - check verify')
			.get(common.api + 'me/verify')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectJSON({
				trustlevel: 78,
				available: ['otc'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npostatute',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npomemorandum',
					},
					{
						step: 3,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npoadmins',
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
				trustlevel: 78,
				available: ['otc'],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npostatute',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npomemorandum',
					},
					{
						step: 3,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npoadmins',
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
				trustlevel: 100,
				available: [],
				verification: [
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npostatute',
					},
					{
						step: 1,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npomemorandum',
					},
					{
						step: 3,
						state: 'accepted',
						rejectreason: null,
						medias: [],
						provider: 'npoadmins',
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
	/* Registration of admins */
	(data, next) => next({ username: 'testverifynpo_ms1', npo: data }),
	signup,
	login,
	checkToken,
	function (data, next) {
		frisby.create('/me - check adminof')
			.get(common.api + 'me')
			.expectStatus(200)
			.expectJSON({
				adminof: ["testverifynpo_npo"]
			})
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(j => next(data))
			.toss();
	},
	(data, next) => next({ username: 'testverifynpo_ms2', npo: data.npo }),
	signup,
	login,
	checkToken,
	(data, next) => frisby.create('/me - check adminof')
		.get(common.api + 'me')
		.expectStatus(200)
		.expectJSON({
			adminof: ["testverifynpo_npo"]
		})
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => next({ username: 'testverifynpo_ms3', npo: data.npo }),
	signup,
	login,
	checkToken,
	function (data, next) {
		frisby.create('/me - check adminof')
			.get(common.api + 'me')
			.expectStatus(200)
			.expectJSON({
				adminof: ["testverifynpo_npo"]
			})
			.addHeader('authorization', 'Bearer ' + data.token)
			.afterJSON(j => next(data))
			.toss();
	},

	/* Check if admins are filled */
	(data, next) => next({ username: 'testverifynpo_npo', password: 'testverifynpo_npo' }),
	login,
	checkToken,

	(data, next) => frisby.create('/me/edit - complete profile')
		.post(common.api + 'me', {
			bio: 'Davide Gessa NOPROF bio',
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),

	(data, next) => frisby.create('/me/admin - check admins')
		.get(common.api + 'me/admin')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSON({
			admins: ["testverifynpo_ms1@gmail.com", "testverifynpo_ms2@gmail.com", "testverifynpo_ms3@gmail.com"]
		})
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss(),
	common.cleanResources('testverifynpo')
]);
