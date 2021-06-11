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
import { $UserDocument, $Verification } from "../../../user/user.model";
import error = require('../../../../error');
import mediaController = require('../../../media/media.controller');
import notificationController = require('../../../notification/notification.controller');
import mailHelper = require('../../../../helpers/mail');
import telegramHelper = require('../../../../helpers/telegram');
import schemaValidatorHelper = require('../../../../helpers/schema-validator');
import { UserVerificationProvider } from "../userverificationprovider";

export class NpoAdminsVerificationProvider extends UserVerificationProvider {
	constructor() {
		super('npoadmins', ['npo'], 3, [], { default: 25 });
	}

	async NPOAdminsInfo(req: Request, res: Response, user: $UserDocument, oldver: $Verification) {
		const adminSchema = {
			firstname: { required: true, type: 'string', min: 3 },
			lastname: { required: true, type: 'string', min: 3 },
			email: { required: true, type: 'email' },
			idnumber: { required: true, type: 'string', min: 4 }
		};

		/* Check the sanity */
		if (!('admins' in req.body))
			return error.response(res, 'E3');
		if (req.body.admins.length < 3)
			return error.response(res, 'E3');

		const admins = [];
		for (let i = 0; i < req.body.admins.length; i++) {
			const a = schemaValidatorHelper.validateSchema(res, req.body.admins[i], adminSchema)
			if (a)
				admins.push(a);
			else
				return;
		}


		/* Non permettere di accettare se le mail sono duplicate (gia' in frontend) */
		const ems = [];
		for (let i = 0; i < admins.length; i++) {
			if (ems.indexOf(admins[i].email) != -1) {
				return error.response(res, 'E3');
			}
			ems.push(admins[i].email);
		}


		/* Set the incharge or keep the user referent */
		let incharge = null;
		if ('incharge' in req.body && req.body.incharge != null) {
			incharge = schemaValidatorHelper.validateSchema(res, req.body.incharge, adminSchema);
			if (incharge === false) return;
		}

		const ver = {
			provider: 'npoadmins',
			medias: [],
			info: {
				admins: admins,
				incharge: req.body.incharge // person or null;
			},
			step: 1,

			submissiondate: new Date(Date.now()),
			submissionip: String(req.headers['x-forwarded-for']) || req.connection.remoteAddress,
			responsedate: null,
			state: 'submission',
			rejectreason: null
		};


		if (oldver !== null) {
			// await mediaController.removeMediaList (oldver.medias);
			ver.medias = oldver.medias;
		}

		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});
		} catch (err) {
			return error.response(res, 'E');
		}
	}

	async NPODocumentUpload(req: Request, res: Response, user: $UserDocument, ver: $Verification) {
		if (ver === null)
			return error.response(res, 'E');

		ver.step = 2;

		/* Upload new file */
		const data = await mediaController.uploadPrivate(req, res, user.username, {
			container: 'documents',
			filename: `NPO_ADMINS${user.username}_${(new Date()).getTime()}`,
			types: ['image', 'pdf']
		});

		if (data.image === null)
			return error.response(res, 'E');

		/* Overwrite old media if present */
		if (ver.medias.length != 0) {
			await mediaController.removeMedia(ver.medias[0].mid as any);
			ver.medias = [];
		}

		ver.medias.push({ mid: data.image._id, name: 'admins' });
		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});
		} catch (err) {
			return error.response(res, 'E');
		}
	}


	async NPOAdminsFinalize(req: any, res: Response, user: $UserDocument, ver: $Verification) {
		if (ver === null)
			return error.response(res, 'E');

		if (ver.medias.length < 1)
			return error.response(res, 'EV6');

		user.locked = true;
		ver.step = 3;
		ver.state = 'pending';
		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});

			notificationController.done(req.username, 'noVerification');

			telegramHelper.notify(`Verification 'npoadmins' submitted by ${user.username} (${user.usertype}): pending approval`);
			mailHelper.send('info@helperbit.com', `[Verification] New pending 'npoadmins' verification from ${user.username} ${user.usertype}`,
				`Verification npoadmins submitted by ${user.username} (${user.usertype}): pending approval`);
		} catch (err) {
			return error.response(res, 'E');
		}
	}

	getStep(i: number): (req: any, res: Response<any>, user: $UserDocument, ver: $Verification) => void {
		return [this.NPOAdminsInfo, this.NPODocumentUpload, this.NPOAdminsFinalize][i];
	}
}

