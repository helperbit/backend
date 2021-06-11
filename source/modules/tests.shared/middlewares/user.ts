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
import { frisbyChain } from './frisby-chain';
import execSync = require('sync-exec');
import formdata = require('form-data');
import fs = require('fs');
import common = require('./common');

/* Signup of an user */
export function signup(data, next) {
	if (data.usertype === undefined)
		data.usertype = 'singleuser';
	if (data.email === undefined)
		data.email = data.username + '@gmail.com';
	if (data.password === undefined)
		data.password = data.username;
	if (data.subtype === undefined)
		data.subtype = 'none';

	frisby.create('/signup - create account')
		.post(common.api + 'signup', {
			username: data.username,
			email: data.email,
			password: data.password,
			terms: true,
			newsletter: false,
			usertype: data.usertype,
			subtype: data.subtype,
			refby: data.refby || null,
			language: data.language || undefined,
			fullname: "giani"
		}, { json: true })
		.expectStatus(200)
		.afterJSON(j => next(data))
		.toss();
}

/* Login of a signed user */
export function login(data, next) {
	frisby.create('/login - correct login')
		.post(common.api + 'login', {
			user: data.username,
			password: data.password,
			language: data.language || undefined,
		}, { json: true })
		.expectStatus(200)
		.expectJSON({
			username: data.username
		})
		.expectJSONTypes({
			token: String,
			username: String,
			expiration: Number
		}).afterJSON(json => {
			data.token = json.token;
			next(data);
		})
		.toss();
}



/* Check token */
export function checkToken(data, next) {
	frisby.create('/auth/state - check')
		.get(common.api + 'auth/state')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON({ username: data.username, auth: "ok" })
		.afterJSON(j => next(data))
		.toss();
}



/* Dummy verify an user */
export function verifyFake(data, next) {
	const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.users.update({username: \"" + data.username + "\"}, {$set: {trustlevel: 56, verification: [{provider: \"manual\", state: \"accepted\"}]}}, {multi: true})'";
	execSync(cmd);
	next(data);
}

export function acceptVerification(provider) {
	return (data, next) => {
		const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.users.update({username: \"" + data.username + "\", \"verification.provider\":\"" + provider + "\"}, {$set: {\"verification.$.state\": \"accepted\" }}, {multi: false})'";
		execSync(cmd);
		next(data);
	};
}

export function rejectVerification(provider, reason) {
	return (data, next) => {
		const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.users.update({username: \"" + data.username + "\", \"verification.provider\":\"" + provider + "\"}, {$set: {\"verification.$.state\": \"rejected\",\"verification.$.rejectreason\":\"" + reason + "\" }}, {multi: false})'";
		execSync(cmd);
		next(data);
	};
}

export function inprogressVerification(provider) {
	return (data, next) => {
		const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.users.update({username: \"" + data.username + "\", \"verification.provider\":\"" + provider + "\"}, {$set: {\"verification.$.state\": \"inprogress\"}}, {multi: false})'";
		execSync(cmd);
		next(data);
	};
}

export function setOTCCode(code) {
	return (data, next) => {
		const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.users.update({username: \"" + data.username + "\", \"verification.provider\":\"otc\"}, {$set: {\"verification.$.hidden.code\": \"" + code + "\"}}, {multi: false})'";
		execSync(cmd);
		next(data);
	};
}

export function setAllowedAdminsVerify(allowedadmins) {
	return (data, next) => {
		const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.users.update({username: \"" + data.username + "\" }, {$set: {\"allowedadmins\": " + JSON.stringify(allowedadmins).replace('"', '\"') + " }}, {multi: false})'";
		execSync(cmd);
		next(data);
	};
}

/* Set allowed admins */
export function setAllowedAdmins(username, admins) {
	const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.users.update({username: \"" + username + "\"}, {$set: {allowedadmins: " + JSON.stringify(admins).replace('"', '\"') + " }}, {multi: true})'";
	execSync(cmd);
}

export function setBan(username, ban) {
	const cmd = "mongo " + common.mongoHost + " helperbit --eval 'db.users.update({username: \"" + username + "\"}, {$set: {banned: " + ban + " }}, {multi: true})'";
	execSync(cmd);
}


/* Upload avatar */
export function uploadCustomAvatar(fileName) {
	return (data, next) => {
		const form = new formdata();
		form.append('file', fs.createReadStream('source/modules/tests.shared/data/' + fileName), {
			knownLength: fs.statSync('source/modules/tests.shared/data/' + fileName).size
		});

		frisby.create('/me/media/avatar: upload avatar')
			.post(common.api + 'me/media/avatar', form, { json: false })
			.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
			.addHeader('authorization', 'Bearer ' + data.token)
			.addHeader('content-length', form.getLengthSync())
			.expectStatus(200)
			.afterJSON(json => {
				data.avatarid = json.id;
				next(data);
			})
			.toss();
	};
}

export function uploadAvatar(data, next) {
	return uploadCustomAvatar('test.png')(data, next);
}

/* Upload cover */
export function uploadCustomCover(fileName) {
	return (data, next) => {
		const form = new formdata();
		form.append('file', fs.createReadStream('source/modules/tests.shared/data/' + fileName), {
			knownLength: fs.statSync('source/modules/tests.shared/data/' + fileName).size
		});

		frisby.create('/me/media/photo: upload cover photo')
			.post(common.api + 'me/media/photo', form, { json: false })
			.addHeader('content-type', 'multipart/form-data; boundary=' + form.getBoundary())
			.addHeader('authorization', 'Bearer ' + data.token)
			.addHeader('content-length', form.getLengthSync())
			.expectStatus(200)
			.afterJSON(json => {
				data.photoid = json.id;
				next(data);
			})
			.toss();
	};
}

export function uploadCover(data, next) {
	return uploadCustomCover('test.png')(data, next);
}


/* Add admin */
export function addAdmins(data, next) {
	setAllowedAdmins(data.username, data.admins);

	for (let i = 0; i < data.admins.length; i++) {
		frisby.create('/me/admin/add - npo admin add')
			.post(common.api + 'me/admin/add', {
				email: data.admins[i]
			}, { json: true })
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.toss();
	}
	next(data);
}


export function hasLastBadge(user, badge) {
	return (data, next) => {
		frisby.create(`/stats/lastbadges - Get last badges, check for ${user} => ${badge}`)
			.get(common.api + 'stats/lastbadges')
			.expectStatus(200)
			.expectJSONTypes({
				lastbadges: Array
			})
			.expectJSON('lastbadges.?', {
				code: badge,
				user: user
			})
			.afterJSON(j => next(data))
			.toss();
	}
}

export function hasNotification(notif) {
	return (data, next) => {
		frisby.create(`/me/notifications - Notification - Check for ${notif}`)
			.get(common.api + 'me/notifications')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.retry(500, 5000)
			.expectJSONTypes({
				notifications: Array
			})
			.expectJSON('notifications.?', {
				code: notif
			})
			.afterJSON(j => next(data))
			.toss();
	};
}

export function hasBadge(badge) {
	return (data, next) => {
		frisby.create(`/me - Badge list - Check for badge ${badge}`)
			.get(common.api + 'me')
			.expectStatus(200)
			.addHeader('authorization', 'Bearer ' + data.token)
			.retry(500, 5000)
			.expectJSONTypes({
				badges: Array
			})
			.expectJSON('badges.?', {
				code: badge
			})
			.afterJSON(j => hasNotification('51')(data, next))
			.toss();
	};
}


export function createAdmins(base) {
	return (data2, next2) => frisbyChain({}, [
		/* Admin 1 */
		(dataMS0, next) => next({ username: base + '_ms3', adminob: [] }),
		signup,
		login,
		checkToken,

		/* Admin 2 */
		(dataMS1, next) => next({ username: base + '_ms2', adminob: [dataMS1] }),
		signup,
		login,
		checkToken,

		/* Admin 3*/
		(dataMS2, next) => next({ username: base + '_ms1', adminob: [dataMS2.adminob[0], dataMS2] }),
		signup,
		login,
		checkToken,
		(data, next) => {
			data2.admins = [base + '_ms3@gmail.com', base + '_ms2@gmail.com', base + '_ms1@gmail.com'];
			data2.adminob = [data.adminob[0], data.adminob[1], data];

			next2(data2);
		}
	]);
}




/* Geolocalize in the last main event */
export function geolocalizeAsAffected(data, next) {
	frisby.create('/events/all')
		.get(common.api + 'events/all')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON({ main: Array })
		.afterJSON((jsonev) => {
			const ev = jsonev.events.filter(e => !e.issea);

			frisby.create('/me - geolocalizing as affected')
				.post(common.api + 'me', { location: ev[0].epicenter }, { json: true })
				.expectStatus(200)
				.addHeader('authorization', 'Bearer ' + data.token)
				.afterJSON(json => {
					data.eventid = ev[0]._id;
					next(data);
				}).toss();
		})
		.toss();
}

/* Geolocalize in the the europe */
export function geolocalizeIn(country, data, next) {
	frisby.create('/me - geolocalize')
		.post(common.api + 'me', { country: country }, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.afterJSON(j => next(data))
		.toss();
}
