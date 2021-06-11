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
import { $UserDocument, $Verification } from "../../user/user.model";
import randomstring = require('randomstring');
import error = require('../../../error');
import notificationController = require('../../notification/notification.controller');
import mailHelper = require('../../../helpers/mail');
import telegramHelper = require('../../../helpers/telegram');
import { UserVerificationProvider } from "./userverificationprovider";


export class OTCVerificationProvider extends UserVerificationProvider {
	constructor() {
		super('otc', ['singleuser', 'npo', 'company'], 2, ['residency', 'document', 'company'], 
			{ default: 20, singleuser: 15, npo: 30 });
	}
	
	async OTCRequest(req: any, res: Response, user: $UserDocument, oldver: $Verification) {
		if (oldver !== null) {
			return this.OTCCodeSubmit(req, res, user, oldver);
		}

		const ver: $Verification = {
			provider: 'otc',
			medias: [],
			info: {},
			hidden: {
				code: randomstring.generate({ readable: true, length: 16 })
			},
			step: 1,

			submissiondate: new Date(Date.now()),
			submissionip: String(req.headers['x-forwarded-for']) || req.connection.remoteAddress,
			responsedate: null,
			state: 'pending',
			rejectreason: null
		};

		user.locked = true;
		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});

			notificationController.done(req.username, 'noVerification');

			telegramHelper.notify(`Verification 'otc' submitted by ${user.username} (${user.usertype}): pending approval`);
			mailHelper.send('info@helperbit.com', `[Verification] New pending 'otc' verification from ${user.username} ${user.usertype}`,
				`Verification otc submitted by ${user.username} (${user.usertype}): pending approval`);
		} catch (err) {
			return error.response(res, 'E');
		}
	}

	async OTCCodeSubmit(req: Request, res: Response, user: $UserDocument, ver: $Verification) {
		if (ver === null)
			return error.response(res, 'E');

		if (ver.state != 'inprogress')
			return error.response(res, 'E');

		if (ver.hidden && req.body.otc == ver.hidden.code) {
			ver.state = 'accepted';

			user.updateVerification(ver);

			try {
				await user.save();
				res.status(200);
				res.json({});

				notificationController.done(user.username, 'verificationOTCSent');
				await notificationController.notify({
					user: user,
					code: 'verifyOTCDone'
				});
			} catch (err) {
				return error.response(res, 'E');
			}
		} else {
			return error.response(res, 'EV4');
		}
	}

	public getStep(i: number): (req: any, res: Response<any>, user: $UserDocument, ver: $Verification) => void {
		return [this.OTCRequest, this.OTCCodeSubmit][i];
	}
}
