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

import { Request, Response, NextFunction } from "express";
import { $UserDocument, UserModel, User } from "../user/user.model";
import moment = require('moment');
import ratelimit = require('express-rate-limit');
import request = require('request-promise-native');
import error = require('../../error');
import log = require('../../log');
import conf = require('../../conf');
import { RedisCache } from "../../helpers/cache";
import { verifyToken, sha256, tokenize, signToken } from "../../helpers/crypto";
import notificationController = require('../notification/notification.controller');
import telegramHelper = require('../../helpers/telegram');
import schemaValidator = require('../../helpers/schema-validator');
import mailHelper = require('../../helpers/mail');
import badgeController = require('../user.badge/badge.controller');
import { requestPostTyped } from "../../helpers/request-typed";

const apiAccessList = require('../../data/api_access.json');
const hbCache = new RedisCache();
const moduleName = 'user.auth';

export async function checkIPConflict(user: $UserDocument, ip: string) {
	let users = await UserModel.usersByIP(ip);
	users = users.filter(u => u.username != user.username);

	if (users.length > 0) {
		let s = `User - ${user.username} is using an IP already used by:`;

		if (conf.env == 'local') {
			s += ` ${users.length} users`;
		} else {
			users.forEach(u => {
				s += `\n\t  - ${u.username} ${u.usertype} (${moment(u.regdate).format('lll')})`;
			});
		}
		telegramHelper.notify(s);
	}
}

/* Check if this user is in an allowedadmins; if yes, add */
export async function checkIfAdminToAdd(ouser: $UserDocument) {
	const user = await User.findOne({ username: ouser.username }, 'adminof email username').exec();
	const unpo = await User.find({ 'verification.info.admins.email': user.email, 'verification.provider': 'npoadmins', 'verification.state': 'accepted' }, 'admins +verification.hidden verification username fullname email').exec();

	for (let i = 0; i < unpo.length; i++) {
		if (user.adminof.indexOf(unpo[i].username) == -1) {
			user.adminof.push(unpo[i].username);
			await user.save();

			await notificationController.notify({
				user: user,
				code: 'becomeAdmin',
				email: true,
				data: { user: unpo[i].username, fullname: unpo[i].fullname },
				redirect: '' + unpo[i].username
			});
		}
		if (unpo[i].admins.indexOf(user.email) == -1) {
			await User.updateOne({ username: unpo[i].username }, { $push: { 'admins': user.email } }).exec();
		}
	}
}

/* Check if the npo user has allowedadmins to add */
export async function checkIfHasAdminsToAdd(ouser: $UserDocument) {
	const unpo = await User.findOne({ username: ouser.username }, '+allowedadmins +admins').exec();
	const ver = unpo.getVerification('npoadmins');

	if (!ver || ver.state != 'accepted')
		return;

	const emails = ver.info.admins.map(a => a.email);
	if (unpo.allowedadmins.length < emails.length)
		unpo.allowedadmins = emails;

	if (unpo.admins.length >= emails.length)
		return;

	for (const e of emails) {
		const u = await User.findOne({ email: e, 'activation.status': true }).exec();
		if (!u)
			continue;
		await checkIfAdminToAdd(u);
	}

	await unpo.save();
}


/* Middleware factory: create a new ratelimit object */
export function createRateLimit(where: string) {
	if (!conf.security.rateLimit) return ((req: Request, res: Response, next: () => void) => { return next(); });

	switch (where) {
		case 'signup':
			return (new ratelimit({ windowMs: 60 * 60 * 1000, max: 10 }));
		case 'login':
			return (new ratelimit({ windowMs: 15 * 60 * 1000, max: 25 }));
	}
}


/* Middleware: check if the recaptcha challenge is correct || raise ('E1') */
export async function recaptcha(req: Request, res: Response, next: NextFunction) {
	if (!conf.security.captcha)
		return next();

	if (req.headers.captcha == 'e2e' && conf.blockchain.testnet)
		return next();

	const ver = `secret=${conf.api.recaptcha.key}&response=${req.headers.captcha}`;

	try {
		const data = await requestPostTyped<{ success: boolean }>({
			url: 'https://www.google.com/recaptcha/api/siteverify', 
			body: ver,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(ver)
			}
		});
		if (!data.success)
			return error.response(res, 'E7');

		return next();
	} catch (err) {
		return error.response(res, 'E7');
	}
}




/* Middleware: check the user authentication || raise ('E1')
 * 	req.username: username of the logged user
 */
export async function check(req: any, res: any, next: NextFunction) {
	const bearerHeader = req.headers.authorization;

	if (typeof bearerHeader === 'undefined')
		return error.response(res, 'E1');

	const bearer = bearerHeader.split(" ");
	const bearerToken = bearer[1];

	try {
		const decoded = await verifyToken(bearerToken);

		/* Check if the token is in the tokenhash cache */
		const sh = await hbCache.get('tokenhash_' + decoded.user);
		const sh2 = sha256(bearerToken);
		if (sh != sh2)
			return error.response(res, 'E1');

		req.username = decoded.user;
		res.username = req.username;
		next();

		await hbCache.set('online_' + decoded.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress, 60 * 30);
	} catch (err) {
		error.response(res, 'E1');
	}
}


/* Middleware: check the user authentication (lazy)
 * 	req.username: username of the logged user || null
 */
export async function checkLazy(req: any, res: any, next: NextFunction) {
	const bearerHeader = req.headers.authorization;

	if (typeof bearerHeader === 'undefined') {
		req.username = null;
		return next();
	}

	const bearer = bearerHeader.split(" ");
	const bearerToken = bearer[1];

	try {
		const decoded = await verifyToken(bearerToken);

		/* Check if the token is in the tokenhash cache */
		const sh = await hbCache.get('tokenhash_' + decoded.user);
		const sh2 = sha256(bearerToken);
		if (sh != sh2)
			throw new Error('Token not in tokenhash cache');

		req.username = decoded.user;
		res.username = req.username;

		await hbCache.set('online_' + decoded.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress, 60 * 30);
	} catch (err) {
		req.username = null;
	} finally {
		next();
	}
}



/* Middleware: check the user authentication (lazy) via GET query parameter
 * 	req.username: username of the logged user || null
 */
export async function checkGetLazy(req: any, res: any, next: NextFunction) {
	const bearerToken = req.query.token || undefined;

	if (bearerToken === undefined) {
		req.username = null;
		return next();
	}

	try {
		const decoded = await verifyToken(bearerToken);

		/* Check if the token is in the tokenhash cache */
		const sh = await hbCache.get('tokenhash_' + decoded.user);
		const sh2 = sha256(bearerToken);
		if (sh != sh2)
			throw new Error('Token not in tokenhash cache');

		req.username = decoded.user;
		res.username = decoded.user;

		await hbCache.set('online_' + decoded.user, req.headers['x-forwarded-for'] || req.connection.remoteAddress, 60 * 30);
	} catch (err) {
		req.username = null;
	} finally {
		next();
	}
}



/* GET api/auth/state */
export function getAuthState(req: any, res: Response) {
	res.status(200);
	if (req.username !== null)
		res.json({ auth: 'ok', username: req.username });
	else
		res.json({ auth: 'none', username: null });
}


/* Middleware: check if the user is in the api_access file */
export async function checkAPILogin(req: Request, res: Response, next: NextFunction) {
	const uname = req.body.user;

	if (conf.env in apiAccessList && apiAccessList[conf.env].indexOf(uname) != -1) {
		return next();
	}
	return error.response(res, 'E1');
}


export async function changePassword(req: any, res: Response) {
	if (!('newpassword' in req.body) && !('oldpassword' in req.body || 'token' in req.body))
		return error.response(res, 'E3');

	if (req.body.newpassword.length < 8)
		return error.response(res, 'ES4');

	/* Check if logged */
	let user: $UserDocument;

	if ('token' in req.body && req.username === null) {
		user = await User.findOne({ 'recovery.token': req.body.token }, 'password recovery banner').exec();
		if (user === null)
			return error.response(res, 'ER2');

		if (user.isBanned())
			return error.response(res, 'E');

		if (user.recovery.expiration && user.recovery.expiration < new Date())
			return error.response(res, 'ER3');
	} else if ('oldpassword' in req.body && req.username !== null) {
		user = await UserModel.getByUsername(req.username, 'password recovery');
		if (user === null)
			return error.response(res, 'ER2');
	} else {
		return error.response(res, 'E');
	}

	let match = true;
	if ('oldpassword' in req.body) {
		match = await user.verifyPassword(req.body.oldpassword);
	}

	if (!match)
		return error.response(res, 'EL1');

	user.password = req.body.newpassword;
	user.recovery.token = null;
	user.recovery.expiration = null;

	await user.save();
	res.status(200);
	res.json({});
}


export async function activateAccount(req: Request, res: Response) {
	const user = await UserModel.getByEmail(req.body.email, '+refby');
	if (user === null)
		return error.response(res, 'EA1');

	if (user.isBanned())
		return error.response(res, 'E');

	if (!user.activation.status) {
		if (req.body.token != user.activation.token)
			return error.response(res, 'EA1');

		user.activation.status = true;
		user.updateTrust();

		if (user.refby != null) {
			await badgeController.addBadge(user, 'friend');
		}

		await user.save();
		await notificationController.notify({
			user: user,
			data: { user: user.username },
			code: (user.usertype == 'npo' ? 'welcomeOrganization' : 'welcome'),
			email: true
		});

		telegramHelper.notify(`User - ${user.username} activated his account`);
	}

	res.status(200);
	res.json({});
	await checkIfAdminToAdd(user);
}


export async function resetPassword(req: Request, res: Response) {
	const user: $UserDocument = await UserModel.getByEmail(req.body.email);
	if (user === null)
		return error.response(res, 'ER1');

	if (user.isBanned())
		return error.response(res, 'E');

	/* Crea un token unico e lungo salvato in user */
	const token = Date() + user._id + Math.random();

	user.recovery.token = await tokenize(token);
	user.recovery.expiration = moment().add(2, 'day').toDate();
	await user.save();

	/* Invia una mail con il link di recovery */
	await notificationController.notify({
		user: user,
		code: 'passwordRecovery',
		platform: false,
		email: true,
		data: { user: user.username },
		// $FlowFixMe
		redirect: '?token=' + user.recovery.token
	});

	res.status(200);
	res.json({});

	telegramHelper.notify(`User: ${user.username} started a password recovery`);
}


export async function sendActivationLink(req: Request, res: Response) {
	if (!('email' in req.body)) {
		if (res !== null)
			return error.response(res, 'E3');
		return;
	}

	const user = await UserModel.getByUsernameOrEmail(req.body.email);
	if (user === null) {
		if (res !== null)
			return error.response(res, 'E');
		return;
	}

	if (user.isBanned())
		return error.response(res, 'E');

	/* Invia via mail l'activation */
	const token = Date() + user._id + Math.random();

	user.activation.token = await tokenize(token);
	user.activation.status = false;
	await user.save();

	await notificationController.notify({
		user: user,
		code: 'activateAccount',
		email: true,
		platform: false,
		redirect: `?token=${user.activation.token}&email=${user.email}`
	});

	if (res !== null) {
		res.status(200);
		res.json({});
	}
}

/* POST api/signup */
export async function signup(req: Request, res: Response) {
	const username = req.body.username;
	const email = req.body.email;
	const password = req.body.password;
	const newsletter = req.body.newsletter;
	let subtype = req.body.subtype || 'none';
	const usertype = req.body.usertype || 'singleuser';
	const refby = req.body.refby || null;

	if (['municipality'].indexOf(subtype) == -1 || usertype != 'npo')
		subtype = 'none';

	if (schemaValidator.mailDisposableCheck(email)) {
		error.response(res, 'ES5');

		telegramHelper.notify(`User signup denied: ${username} (${usertype}) was using a disposable domain ${email}`);
		return;
	}

	let userd = await UserModel.getByUsername(username);
	if (userd !== null)
		return error.response(res, 'ES1');

	userd = await UserModel.getByEmail(email);
	if (userd !== null)
		return error.response(res, 'ES2');

	const refuser = await UserModel.getByReferral(refby, 'username');

	const ip = String(req.headers['x-forwarded-for']) || req.connection.remoteAddress;
	const user = new User({
		username: username,
		email: email,
		password: password,
		newsletter: newsletter,
		refcode: (await UserModel.getLastRefCode()) + 1,
		publicfields: ['firstname', 'lastname', 'country', 'gender'],
		regip: ip,
		lastip: ip,
		iphistory: [ip]
	});

	if (refuser !== null) {
		user.refby = refuser.username;
	}

	user.usertype = usertype;
	user.subtype = subtype;

	if (user.isAnOrganization())
		user.fullname = user.username;

	if ('language' in req.body) {
		user.language = req.body.language;
	}

	try {
		await user.save();

		res.status(200);
		res.json({});

		if (!user.isAnOrganization())
			await notificationController.notify({ user: user, code: 'noWallet' });

		await notificationController.notify({ user: user, code: 'noGeolocalization' });
		await notificationController.notify({ user: user, code: 'noVerification' });

		if (user.refby != null && refuser) {
			await notificationController.notify({
				user: refuser,
				data: { user: user.username },
				email: true,
				code: 'referredUserSignup'
			});
		}

		if (user.newsletter) {
			mailHelper.subscribe(email, username).then(() => { }).catch((e) => { });
		}

		if (conf.mail.activation)
			sendActivationLink(req, null);
		else {
			await notificationController.notify({
				user: user,
				data: { user: user.username },
				code: (user.usertype == 'npo' ? 'welcomeOrganization' : 'welcome'),
				email: true
			});
		}

		if (user.refby != null && refuser) {
			telegramHelper.notify(`New user signup: ${username} (${user.usertype}) using a reflink from ${user.refby}`);
		} else {
			telegramHelper.notify(`New user signup: ${username} (${user.usertype})`);
		}

		await checkIPConflict(user, user.lastip);
	} catch (err) {
		return error.response(res, 'E');
	}
}


/* POST api/logout */
export async function logout(req: any, res: Response) {
	await hbCache.del('tokenhash_' + req.username);
	res.status(200);
	res.json({});

	log.debug(moduleName, `User ${req.username} logged out`);
	telegramHelper.notify(`User: ${req.username} logged out`);
}


/* Called by an admin on the backoffice, creates a login url for the given user */
export async function createAccessUrlForBackoffice(uname: string) {
	const user: $UserDocument = await UserModel.getByUsernameOrEmail(uname, 'username language banned policyversion email usertype +password +iphistory +lastip loginlock activation');
	const token = signToken({ user: user.username }, '1d');
	await hbCache.set('tokenhash_' + user.username, sha256(token));
	return `/auth/login?social=true&status=true&token=${token}&email=${user.email}&usertype=${user.usertype}&username=${user.username}`;
}


/* POST api/login */
export async function login(req: Request, res: Response) {
	const uname = req.body.user;

	const user: $UserDocument = await UserModel.getByUsernameOrEmail(uname, 'username language banned policyversion email usertype +password +iphistory +lastip loginlock activation');
	if (user === null)
		return error.response(res, 'EL1');

	if (user.isBanned())
		return error.response(res, 'EA5');

	if (user.loginlock.expiration !== null && moment().isBefore(user.loginlock.expiration))
		return error.response(res, 'EL2', { expiration: moment(user.loginlock.expiration).format() });
	else
		user.loginlock.expiration = null;

	const isMatch = await user.verifyPassword(req.body.password);

	if (!isMatch) {
		if (user.loginlock.n >= 5) {
			user.loginlock.n = 0;
			user.loginlock.expiration = moment().add(5, 'minute').toDate();
			user.save();
			log.debug(moduleName, `Failed login, wrong password: ${user.username}`);
			return error.response(res, 'EL2', { expiration: moment(user.loginlock.expiration).format() });
		} else {
			user.loginlock.n += 1;
			user.save();
			log.debug(moduleName, `Failed login, wrong password: ${user.username}`);
			return error.response(res, 'EL1');
		}
	}

	if (!user.activation.status)
		return error.response(res, 'EL3');

	user.loginlock.n = 0;
	user.loginlock.expiration = null;
	user.lastlogin = new Date();
	user.lastip = String(req.headers['x-forwarded-for']) || req.connection.remoteAddress;

	if (user.iphistory.length == 0 || user.iphistory[user.iphistory.length - 1] != user.lastip)
		user.iphistory.push(user.lastip);

	if ('language' in req.body) {
		user.language = req.body.language;
	}

	user.save();

	const token = signToken({ user: user.username }, '1d');

	res.status(200);
	res.json({
		token: token,
		expiration: 1440,
		username: user.username,
		email: user.email,
		usertype: user.usertype,
		policyversion: {
			current: conf.policyversion,
			accepted: user.policyversion
		}
	});

	await hbCache.set('tokenhash_' + user.username, sha256(token));

	telegramHelper.notify(`User: ${user.username} logged in`);

	if (user.usertype == 'npo')
		await checkIfHasAdminsToAdd(user);
	else
		await checkIfAdminToAdd(user);

	await checkIPConflict(user, user.lastip);
}

