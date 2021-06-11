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

import { Response } from "express";
import error = require('../../error');
import conf = require('../../conf');
import log = require('../../log');
import mailHelper = require('../../helpers/mail');
import stringHelper = require('../../helpers/string');
import { $UserDocument, User, UserModel } from '../../modules/user/user.model';
import { Notification } from "./notification.model";

const maildata = require('../../data/mail.json');


export interface NotificationDescriptor {
	code: number;
	redirect?: string;
	permanent?: boolean;
}

const notifications: {[key: string]: NotificationDescriptor} = {
	noWallet: { code: 1, redirect: '/me/wallet' },
	noGeolocalization: { code: 2, redirect: '/me/geoloc' },
	noVerification: { code: 3, redirect: '/me/verify' },
	donationReceived: { code: 4, redirect: '/donation/' },
	becomeAdmin: { code: 5, redirect: '/user/' },
	feedMultisig: { code: 6, redirect: '/me/wallet/feedmultisig', permanent: true },
	signMultisig: { code: 7, redirect: '/me/wallet', permanent: true },
	welcome: { code: 8 },
	welcomeOrganization: { code: 8 },
	passwordRecovery: { code: 9, redirect: '/auth/recovery' },
	activateAccount: { code: 10, redirect: '/auth/login' },
	createdMultisig: { code: 11, redirect: '/me/wallet' },
	verificationDone: { code: 12, redirect: '/me' },
	multisigBroadcast: { code: 13, redirect: '/donation/transaction/' },
	verificationOTCSent: { code: 14, redirect: '/me/verify' },
	removedAdmin: { code: 15, redirect: '/user/' },

	rorReceived: { code: 16, redirect: '/me/rors', permanent: true },
	rorRejected: { code: 17, redirect: '/me/rors' },
	rorAccepted: { code: 18, redirect: '/me/rors' },
	rorSent: { code: 19, redirect: '/me/rors' },
	signRORMultisig: { code: 20, redirect: '/me/wallet', permanent: true },
	multisigRORBroadcast: { code: 21, redirect: '/transaction/' },

	donationInvoiceRequest: { code: 22, redirect: '/donation/' },

	referredUserSignup: { code: 23, redirect: '/me/ambassador' },

	projectApproved: { code: 24, redirect: '/project/' },
	projectRejected: { code: 25, redirect: '/project/create' },

	verifyDocumentDone: { code: 30, redirect: '/me/verify' },
	verifyResidencyDone: { code: 31, redirect: '/me/verify' },
	verifyOTCDone: { code: 32, redirect: '/me/verify' },
	verifyNPODocumentsDone: { code: 33, redirect: '/me/verify' },
	verifyFullyVerified: { code: 34, redirect: '/me/verify' },
	verifyCompanyDocumentsDone: { code: 35, redirect: '/me/verify' },
	verificationRejected: { code: 36, redirect: '/me/verify' },
	verifyNPOStatuteDone: { code: 37, redirect: '/me/verify' },
	verifyNPOMemorandumDone: { code: 38, redirect: '/me/verify' },
	verifyNPOAdminsDone: { code: 39, redirect: '/me/verify' },

	donationCampaignReceived: { code: 40, redirect: '/campaign/' },
	campaignExpired: { code: 41, redirect: '/campaign/' },
	campaignConcluded: { code: 42, redirect: '/campaign/' },
	campaignDeleted: { code: 43, redirect: '/campaign/create' },
	campaignBirthday: { code: 44, redirect: '/campaign/create' },

	ambassadorMerchandiseAssigment: { code: 50, redirect: '/me/ambassador' },
	badgeAchieved: { code: 51, redirect: '/me/badges' },

	signVerifyMultisig: { code: 60, redirect: '/me/wallet/verify' }
};


/* Return the notification given the code */
function notificationOfCode(code: string): NotificationDescriptor {
	const nf = Object.keys(notifications);

	for (let i = 0; i < nf.length; i++) {
		if (notifications[nf[i]].code == parseInt(code))
			return notifications[nf[i]];
	}

	return null;
}


interface NotifyOpts {
	user: $UserDocument | string;
	code: string;
	data?: any;
	email?: boolean;
	platform?: boolean;
	redirect?: string;
}

export async function notify(opts: NotifyOpts): Promise<void> {
	if (!('email' in opts))
		opts.email = false;
	if (!('platform' in opts))
		opts.platform = true;
	if (!('redirect' in opts))
		opts.redirect = '';
	if (!('data' in opts) || !opts.data)
		opts.data = { url: '' };

	const mailSend = async (user) => {
		const url = conf.url + (notifications[opts.code].redirect || '/') + (opts.redirect || '');
		opts.data.url = url.replace(/ /g, '%20');

		let cmaildata = maildata[opts.code];

		if ('language' in user && user.language in cmaildata)
			cmaildata = cmaildata[user.language];
		else
			cmaildata = cmaildata.en;

		try {
			const body = stringHelper.interpolate(cmaildata.body, opts.data);
			const subject: string = stringHelper.interpolate(cmaildata.subject, opts.data);

			await mailHelper.send(user.email, subject, body);
			return;
		} catch (err) {
			Promise.reject(err);
		}
	};

	let user = null;
	if (typeof (opts.user) == 'string') {
		user = await User.findOne({ $or: [{ username: opts.user }, { email: opts.user }] }).exec();
	} else {
		user = opts.user;
	}

	if (user == null) {
		if (typeof (opts.user) === 'string')
			log.critical('Notification', `User ${opts.user} not found.`);
		return Promise.reject();
	}

	if (opts.platform) {
		const n = new Notification();
		n.owner = user.username;
		n.code = String(notifications[opts.code].code);
		n.redirect = (notifications[opts.code].redirect || '/') + (opts.redirect || '');
		n.redirect.replace(/ /g, '%20');

		n.data = opts.data || {};

		try {
			await n.save()
			if (opts.email && user.email)
				return mailSend(user);
			else
				return;
		} catch (err) {
			return Promise.reject(err);
		}
	}
	else if (opts.email) {
		return mailSend(user);
	}
}


export async function getList(req: any, res: Response) {
	const ns = await Notification.find({ owner: req.username })
		.sort({ 'unread': 'desc', 'time': 'desc' })
		.limit(50)
		.exec();

	const c = await Notification.countDocuments({ owner: req.username, unread: true }).exec();

	res.status(200);
	res.json({ notifications: ns, unread: c });
}


export async function remove (req: any, res: Response) {
	const n = await Notification.findOne({ _id: req.params.id, owner: req.username }).exec();

	if (n === null) {
		return error.response(res, 'E');
	}

	const nofcode: any = notificationOfCode(n.code);
	let permanent = false;

	if (nofcode)
		permanent = nofcode.permanent;

	if (!permanent) {
		n.unread = false;
		await n.save();
		res.status(200);
		res.json({});
		// Notification.remove ({ _id: req.params.id, owner: req.username }, next);
	}
	else
		return error.response(res, 'E');
}




/* If the given user has a notification of type code, remove it.
 * username could be an username, an email, an array of username/email */
export async function done(username: string | string[], notif: string, q?: any) {
	const doneSingle = async (uname) => {
		let username = uname;
		if (username.indexOf('@') != -1) {
			const user = await UserModel.getByEmail(username, 'username');
			username = user.username;
		}

		const query = q || {};
		query.owner = username;
		query.code = notifications[notif].code;

		const not = await Notification.findOne(query).exec();
		if (not) {
			not.unread = false;

			await not.save();
			// Notification.remove(query, (err) => { });
		} else {
			// Notification.remove(query, (err) => { });
		}
	};

	if (typeof (username) == 'object') {
		for (let i = 0; i < username.length; i++)
			await doneSingle(username[i]);
	} else {
		await doneSingle(username);
	}
}


/* Returns true if the user has a notification of type notif since minTime */
export async function hasNotification(user: string, notif: string, minTime?: Date) {
	const n = notifications[notif];
	const q: any = { owner: user, code: n.code };
	if (minTime)
		q.time = { $gt: minTime };

	return (await Notification.findOne(q).exec()) != null;
}
