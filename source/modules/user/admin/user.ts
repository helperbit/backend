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

import { Request, Response } from "express";
import { $UserDocument, $Verification, User, UserModel } from '../user.model';
import { WalletModel, Wallet } from "../../wallet/wallet.model";
import { Project } from "../../project/project.model";
import { AdminLogModel } from "../../admin.log/log.model";
import { Notification } from "../../notification/notification.model";
import { RedisCache } from "../../../helpers/cache";
import conf = require('../../../conf');
import notificationController = require('../../notification/notification.controller');
import AdminLogController = require('../../admin.log/log.controller');
import badgeController = require('../../user.badge/badge.controller');
import mailHelper = require('../../../helpers/mail');
import schemaHelper = require('../../../helpers/schema-validator');
import { Async } from "../../../helpers/async";
import { Transaction } from "../../wallet.transaction/transaction.model";
import { adminQueryPaginate, AdminPaginateRequest } from "../../admin/utils";
import { checkLogin, checkAuth } from '../../admin/auth';
import authController = require('../../user.auth/auth.controller');

const router = require('express').Router();
const countryName = require('../../../data/country_names.json');
const hbCache = new RedisCache();

router.get('/users/verify/thirdparty', checkLogin, async (req: Request, res: Response) => {
	const users = await User.find({
		usertype: "npo",
		allowdocumentssharing: true
	}).sort({ regdate: 'desc' }).exec();

	res.render('user/admin/third-party-docs', {
		page: 'user',
		users: users
	});
});

router.post('/users/verify/thirdparty/settinklitapi', checkLogin, async (req: Request, res: Response) => {
	const user = await User.findOne({ username: req.body.username, allowdocumentssharing: true }).exec();

	user.api.tinklit.clientId = req.body.clientId;
	user.api.tinklit.token = req.body.token;
	await user.save();

	res.status(200);
	res.json({});
});

router.get('/users/verify/:provider/pending', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const provider = req.params.provider;
	const query = User.find({ "verification": { $elemMatch: { "provider": provider, "state": 'pending' } } });
	const data = await adminQueryPaginate(query, req.query);
	res.render('user/admin/list', { page: 'user', users: data.results, pagination: data.pagination, title: 'Pending ' + provider + ' verify' });
});


router.get('/users/verify/:provider/inprogress', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const provider = req.params.provider;
	const query = User.find({ "verification": { $elemMatch: { "provider": provider, "state": 'inprogress' } } });
	const data = await adminQueryPaginate(query, req.query);
	res.render('user/admin/list', { page: 'user', users: data.results, pagination: data.pagination, title: 'In progress ' + provider + ' verify' });
});

router.get('/users/bytype/:type', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = User.find({ usertype: req.params.type }, 'username banned usertype subtype email firstname lastname fullname country trustlevel regdate activation socialauth verification').sort({ regdate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('user/admin/list', { page: 'user', users: data.results, pagination: data.pagination, title: 'By type: ' + req.params.type });
});

router.get('/users/notactive', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = User.find({ 'activation.status': false }).sort({ regdate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('user/admin/list', { page: 'user', users: data.results, pagination: data.pagination, title: 'Not active' });
});

router.get('/users/premium', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = User.find({ 'premium.enabled': true }).sort({ regdate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('user/admin/list', { page: 'user', users: data.results, pagination: data.pagination, title: 'Premium' });
});

router.get('/users/banned', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const query = User.find({ banned: true }).sort({ regdate: 'desc' });
	const data = await adminQueryPaginate(query, req.query);
	res.render('user/admin/list', { page: 'user', users: data.results, pagination: data.pagination, title: 'Banned' });
});


router.get('/users/ipconflicts', checkLogin, async (req: Request, res: Response) => {
	let ips = await User
		.aggregate()
		.match({})
		.unwind('iphistory')
		.sort({ lastlogin: 'desc' })
		.group({
			_id: '$iphistory',
			users: { $push: { username: '$username', usertype: '$usertype', regdate: '$regdate' } }
		})
		.exec();

	ips = ips.map(ip => {
		const nl = [];
		const mm = {};

		ip.users.forEach(u => {
			if (u.username in mm)
				return;

			mm[u.username] = true;
			nl.push(u);
		});

		return {
			_id: ip._id,
			users: nl
		};
	});

	res.render('user/admin/ipconflicts', { page: 'user', ips: ips, title: 'IP Conflicts' });
});


router.get('/users/aggregated/bycity', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const pagination = {
		sort: req.query.sort || 'desc',
		by: req.query.by || 'count'
	};

	const sort = {};
	sort[pagination.by] = pagination.sort;

	const users = await User
		.aggregate()
		.match({ 'activation.status': true, country: 'ITA', city: { $ne: '' } })
		.group({
			_id: '$city',
			region: { $last: '$region' },
			country: { $last: '$country' },
			count: { $sum: 1 }
		})
		.project({
			city: '$_id',
			region: '$region',
			country: '$country',
			count: '$count'
		})
		.sort(sort)
		.exec();

	res.render('user/admin/bycity', { page: 'user', pagination: pagination, users: users, title: 'By city in Italy' });
});


router.get('/users/aggregated/bycountry', checkLogin, async (req: AdminPaginateRequest, res: Response) => {
	const pagination = {
		sort: req.query.sort || 'desc',
		by: req.query.by || 'total'
	};

	const sort = {};
	sort[pagination.by] = pagination.sort;

	let users = await User
		.aggregate()
		.match({ 'activation.status': true, country: { $ne: '' } })
		.group({
			_id: '$country',
			npo: {
				$sum: { $cond: { if: { $eq: ['$usertype', 'npo'] }, then: 1, else: 0 } }
			},
			company: {
				$sum: { $cond: { if: { $eq: ['$usertype', 'company'] }, then: 1, else: 0 } }
			},
			wallet: {
				$sum: { $cond: { if: { $and: [{ $ne: ['$receiveaddress', ''] }, { $ne: ['$receiveaddress', null] }] }, then: 1, else: 0 } }
			},
			npos: { $push: { $cond: { if: { $eq: ['$usertype', 'npo'] }, then: '$username', else: '' } } },
			total: { $sum: 1 }
		})
		.project({
			country: '$_id',
			npo: '$npo',
			company: '$company',
			wallet: '$wallet',
			npos: '$npos',
			total: '$total'
		})
		.sort(sort)
		.exec();

	users = await Async.map(users, async (u: any) => {
		u.country = u._id;
		u.npowproj = await Project.countDocuments({ owner: { $in: u.npos.filter(n => n.length > 0) }, end: null, status: 'approved' }).exec();
		return u;
	});

	if (pagination.by == 'npowproj')
		users = users.sort((a, b) => {
			if (pagination.sort == 'asc')
				return a.npowproj - b.npowproj;
			else
				return b.npowproj - a.npowproj;
		})

	res.render('user/admin/bycountry', { page: 'user', pagination: pagination, users: users, title: 'By country' });
});


router.get('/user/:name', checkLogin, async (req: Request, res: Response) => {
	const name = req.params.name;
	const user = await UserModel.getByUsername(name, '+verification.hidden +allowedadmins +refby +regip +lastip +iphistory');
	if (user === null)
		return res.redirect('/admin/users');

	const wallets = await WalletModel.listByOwner(user.username);
	const logs = await AdminLogModel.listForRelatedUser(name);
	const admins = await User.find({ email: { $in: user.admins } }, 'trustlevel email username').exec();
	const ambassador = await UserModel.listReferred(user.username, 'trustlevel username email regdate');
	const ipusers = await UserModel.usersByIP(user.iphistory);

	res.render('user/admin/user/user', {
		page: 'user',
		user: user,
		wallets: wallets,
		adminlog: logs,
		baseurl: conf.url,
		admins: admins,
		ipusers: ipusers.filter(u => u.username != user.username),
		ambassador: {
			referred: ambassador.map(a => ({
				username: a.username,
				email: a.email,
				verified: a.trustlevel >= UserModel.constants.minVerifedReferralTrust,
				regdate: a.regdate
			})),
			refby: user.refby,
			count: ambassador.filter(a => a.trustlevel >= UserModel.constants.minVerifedReferralTrust).length
		}
	});
});

router.get('/user/:name/trustupdate', checkAuth('admin'), async (req: Request, res: Response) => {
	const name = req.params.name;
	const user = await UserModel.getByUsername(name);
	user.updateTrust();
	await user.save();
	res.status(200);
	res.json({});
});


router.post('/user/:name/premium', checkAuth('kyc'), async (req: Request, res: Response) => {
	const name = req.params.name;
	const user = await UserModel.getByUsername(name);
	user.premium.enabled = req.body.enabled;
	user.premium.start = req.body.start;
	user.premium.expiration = req.body.expiration;
	await user.save();

	res.status(200);
	res.json({});

	/* Send notification */
	let s = 'disabled';
	if (user.premium.enabled)
		s = `enabled from ${user.premium.start} to ${user.premium.expiration}`;

	await AdminLogController.operation(req, 'User', `Premium status ${s} for user ${name}`, user.username);
});

router.get('/user/:name/loginasuser', checkAuth('admin'), async (req: Request, res: Response) => {
	const name = req.params.name;
	await AdminLogController.operation(req, 'User', `Admin is logging in as ${name}`, name);
	res.status(200);
	res.json({ url: conf.url + (await authController.createAccessUrlForBackoffice(name)) });
});

router.post('/user/:name/changeemail', checkAuth('admin'), async (req: Request, res: Response) => {
	const replaceEmail = (arr, oMail, nMail) => {
		if (arr.indexOf(oMail) == -1)
			return arr;

		arr = arr.filter(h => h != oMail)
		arr.push(nMail);
		return arr;
	};

	const name = req.params.name;
	const user = await UserModel.getByUsername(name);
	const oldemail = user.email;
	user.email = req.body.email;
	await user.save();

	const users = await User.find({ admins: oldemail, allowedadmins: oldemail }, '+allowedadmins +admins').exec();
	for (let i = 0; i < users.length; i++) {
		users[i].admins = replaceEmail(users[i].admins, oldemail, user.email);
		users[i].allowedadmins = replaceEmail(users[i].allowedadmins, oldemail, user.email);
		users[i].markModified('admins');
		users[i].markModified('allowedadmins');
		await users[i].save();
	}

	const wallets = await Wallet.find({
		$or: [
			{ 'multisig.admins': oldemail },
			{ 'multisig.doneadmins': oldemail },
			{ 'multisig.hardwareadmins': oldemail }
		]
	}).exec();

	for (let i = 0; i < wallets.length; i++) {
		wallets[i].multisig.admins = replaceEmail(wallets[i].multisig.admins, oldemail, user.email);
		wallets[i].multisig.doneadmins = replaceEmail(wallets[i].multisig.doneadmins, oldemail, user.email);
		wallets[i].multisig.hardwareadmins = replaceEmail(wallets[i].multisig.hardwareadmins, oldemail, user.email);
		wallets[i].markModified('multisig.admins');
		wallets[i].markModified('multisig.doneadmins');
		wallets[i].markModified('multisig.hardwareadmins');
		await wallets[i].save();
	}

	const transactions = await Transaction.find({
		$or: [
			{ admins: oldemail },
			{ signers: oldemail },
			{ refused: oldemail },
			{ hardwareadmins: oldemail }
		]
	}).exec();

	for (let i = 0; i < transactions.length; i++) {
		transactions[i].admins = replaceEmail(transactions[i].admins, oldemail, user.email);
		transactions[i].signers = replaceEmail(transactions[i].signers, oldemail, user.email);
		transactions[i].hardwareadmins = replaceEmail(transactions[i].hardwareadmins, oldemail, user.email);
		transactions[i].refused = replaceEmail(transactions[i].refused, oldemail, user.email);
		transactions[i].markModified('admins');
		transactions[i].markModified('signers');
		transactions[i].markModified('hardwareadmins');
		transactions[i].markModified('refused');
		await transactions[i].save();
	}


	await user.save();

	res.status(200);
	res.json({});

	/* Send notification */
	await mailHelper.send(user.email, 'Mail changed for your Helperbit account', 'As requested, we updated the email address for your Helperbit account');
	await AdminLogController.operation(req, 'User', `Changed the email of ${name}`, user.username);
});


router.post('/user/:name/ban', checkAuth('kyc'), async (req: Request, res: Response) => {
	const name = req.params.name;
	const user = await UserModel.getByUsername(name);
	user.banned = true;
	await user.save();

	res.status(200);
	res.json({});

	/* Send notification */
	await mailHelper.send(user.email, 'You are banned from Helperbit.com', req.body.reason);
	await AdminLogController.operation(req, 'User', `Banned user ${name} for violating TOS (Reason: "${req.body.reason}")`, user.username);
	await hbCache.del('tokenhash_' + name);
});

router.post('/user/:name/unban', checkAuth('kyc'), async (req: Request, res: Response) => {
	const name = req.params.name;
	const user = await UserModel.getByUsername(name);
	user.banned = false;
	await user.save();

	res.status(200);
	res.json({});

	/* Send notification */
	await mailHelper.send(user.email, 'You are unbanned from Helperbit.com', req.body.reason);
	await AdminLogController.operation(req, 'User', `Unbanned user ${name} (Reason: "${req.body.reason}")`, user.username);
});



router.post('/user/:name/activate', checkAuth('admin'), async (req: Request, res: Response) => {
	const name = req.params.name;
	const user = await UserModel.getByUsername(name);
	user.activation.status = true;
	user.updateTrust();
	await user.save();
	res.status(200);
	res.json({});
	AdminLogController.operation(req, 'User', `User manually activated`, name);
});


router.post('/user/:name/remove', checkAuth('admin'), async (req: Request, res: Response) => {
	const name = req.params.name;

	await User.remove({ username: name }).exec();
	const wallets = await Wallet.find({ owner: name }).exec();
	for (let i = 0; i < wallets.length; i++) {
		wallets[i].owner = wallets[i].owner + '_removed';
		wallets[i].save();
	}

	await Project.remove({ owner: name }).exec();
	await Notification.remove({ owner: name }).exec();

	res.status(200);
	res.json({});
	AdminLogController.operation(req, 'User', `User removed`, name);
});


router.get('/users/online', checkLogin, async (req: Request, res: Response) => {
	const online = await hbCache.keys('online_*');
	const data = {};
	for (let i = 0; i < online.length; i++) {
		try {
			const ip = await hbCache.get(online[i]);
			if (ip !== null && online[i] !== null)
				data[online[i].replace('online_', '')] = ip;
		} catch (err) { }
	}

	return res.render('user/admin/online', { page: 'user', online: data });
});


router.get('/users/geolocalized', checkLogin, async (req: Request, res: Response) => {
	const data = await User.find({ 'location.coordinates': { $ne: [] } }, 'username location');
	return res.render('user/admin/geolocalized', { page: 'user', geolocalized: data });
});

router.get('/user/:name/verify/:provider/delete', checkAuth('kyc'), async (req: Request, res: Response) => {
	const name: string = req.params.name;
	const provider: string = req.params.provider;

	/* Non permettere di accettare se le mail sono vuote */
	if (req.body.state == 'accepted' && provider == 'npo' && req.body.allowedadmins.filter(e => schemaHelper.mailCheck(e)).length != 3) {
		res.status(500);
		return res.json({});
	}

	const user: $UserDocument = await UserModel.getByUsername(name, '+verification.hidden');
	if (user === null) {
		res.status(500);
		return res.json({});
	}
	user.removeVerification(provider);
	await user.save();

	res.redirect('/admin/user/' + name);
});

router.post('/user/:name/verify/:provider', checkAuth('kyc'), async (req: Request, res: Response) => {
	const name: string = req.params.name;
	const provider: string = req.params.provider;

	/* Non permettere di accettare se le mail sono vuote */
	if (req.body.state == 'accepted' && provider == 'npo' && req.body.allowedadmins.filter(e => schemaHelper.mailCheck(e)).length != 3) {
		res.status(500);
		return res.json({});
	}

	const user: $UserDocument = await UserModel.getByUsername(name, '+verification.hidden');
	if (user === null) {
		res.status(500);
		return res.json({});
	}
	const ver: $Verification | null = user.getVerification(provider);

	if (ver == null) {
		res.status(200);
		return res.json({});
	}

	/* Update the verification data */
	ver.state = req.body.state;
	ver.responsedate = new Date(Date.now());

	/* State accepted, send a notification */
	if (ver.state == 'accepted') {
		switch (ver.provider) {
			case 'document':
				await notificationController.notify({ user: user, email: true, code: 'verifyDocumentDone' });
				break;
			case 'npo':
				user.allowedadmins = req.body.allowedadmins.map(mail => mail.toLowerCase());
				await notificationController.notify({ user: user, email: true, code: 'verifyNPODocumentsDone' });
				break;
			case 'company':
				await notificationController.notify({ user: user, email: true, code: 'verifyCompanyDocumentsDone' });
				break;
			case 'residency':
				await notificationController.notify({ user: user, email: true, code: 'verifyResidencyDone' });
				break;
			case 'npostatute':
				await notificationController.notify({ user: user, email: true, code: 'verifyNPOStatuteDone' });
				break;
			case 'npomemorandum':
				await notificationController.notify({ user: user, email: true, code: 'verifyNPOMemorandumDone' });
				break;
			case 'npoadmins':
				if (ver.info) {
					user.allowedadmins = ver.info.admins.map(ad => ad.email.toLowerCase());
					await notificationController.notify({ user: user, email: true, code: 'verifyNPOAdminsDone' });
				}
				break;
		};

		if (user.usertype == 'singleuser' && user.verification.filter(v => { return v.state == 'accepted'; }).length == 4)
			await notificationController.notify({ user: user, email: true, code: 'verifyFullyVerified' });
	}
	/* OTC in progress, send a notification */
	else if (ver.state == 'inprogress' && provider == 'otc') {
		await notificationController.notify({
			user: user,
			email: true,
			code: 'verificationOTCSent',
			data: { user: user.username, fullname: user.fullname, email: user.email }
		});
	}
	/* Rejected, send a notification */
	else if (ver.state == 'rejected') {
		user.locked = false;
		ver.rejectreason = req.body.rejectreason;

		await notificationController.notify({
			user: user,
			email: true,
			code: 'verificationRejected',
			data: { user: user.username, fullname: user.fullname, email: user.email, rejectreason: req.body.rejectreason }
		});
	}

	/* Update trust and save */
	user.updateVerification(ver);
	await user.save();

	if (ver.state == 'rejected') {
		AdminLogController.operation(req, 'User', `User verify provider ${provider}: setting state to ${ver.state} (Notes: ${req.body.note}, Reason email: ${req.body.rejectreason})`, user.username);
	} else {
		AdminLogController.operation(req, 'User', `User verify provider ${provider}: setting state to ${ver.state} (Notes: ${req.body.note})`, user.username);
	}

	res.status(200);
	res.json({});

	if (ver.state == 'accepted') {
		await badgeController.updateUserBadges(name);
	}
});


router.post('/user/:name/verify/inject/manual', checkAuth('kyc'), async (req: Request, res: Response) => {
	const name = req.params.name;

	const user: $UserDocument = await UserModel.getByUsername(name);
	if (user === null) {
		res.status(500);
		return res.json({});
	}

	if (user.getVerification('manual') != null) {
		res.status(500);
		return res.json({});
	}

	user.updateVerification({
		provider: 'manual',
		submissiondate: new Date(Date.now()),
		responsedate: new Date(Date.now()),
		state: 'accepted',
		medias: []
	});

	/* Save */
	await notificationController.notify({ user: user, email: true, code: 'verificationDone' });

	await user.save();
	res.status(200);
	res.json({});
	AdminLogController.operation(req, 'User', `User injected a manual verification`, name);
});


router.get('/user/:name/verify/otc/print', checkAuth('kyc'), async (req: Request, res: Response) => {
	const name = req.params.name;

	const user: $UserDocument = await UserModel.getByUsername(name, '+verification.hidden');
	if (user === null) {
		res.status(500);
		return res.json({});
	}

	const otcver: $Verification | null = user.getVerification('otc');

	if (otcver && otcver.hidden && otcver.hidden.code) {
		const addr = `${user.firstname} ${user.lastname}<br>${user.street} ${user.streetnr}, ${user.zipcode} ${user.city} (${user.region})<br>${countryName[user.country]}`;
		return res.redirect(`${conf.url}/print.html?what=otc&user=${user.username}&token=${otcver.hidden.code}&address=${addr}&auto=true&title=otc-${user.username}.pdf`);
	} else {
		res.status(500);
		return res.json({});
	}
});


export const UserAdminApi = router;
