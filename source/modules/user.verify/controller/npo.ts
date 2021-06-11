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
import error = require('../../../error');
import mediaController = require('../../media/media.controller');
import notificationController = require('../../notification/notification.controller');
import schemaValidatorHelper = require('../../../helpers/schema-validator');
import mailHelper = require('../../../helpers/mail');
import telegramHelper = require('../../../helpers/telegram');
import { UserVerificationProvider } from "./userverificationprovider";


export class NpoVerificationProvider extends UserVerificationProvider {
	constructor() {
		super('npo', ['npo'], 3, [], { default: 40 });
	}

	async NPODocumentInfo(req: Request, res: Response, user: $UserDocument, oldver: $Verification) {
		req.body = schemaValidatorHelper.validateSchema(res, req.body,
			{
				refname: { required: true, type: 'string', min: 4 },
				reftel: { required: true, type: 'string', min: 4 },
				refmail: { required: true, type: 'email' }
			});

		if (req.body === null)
			return error.response(res, 'E3');

		const ver = {
			provider: 'npo',
			medias: [],
			info: {
				refname: req.body.refname,
				reftel: req.body.reftel,
				refmail: req.body.refmail,
				admins: []
			},
			step: 1,

			submissiondate: new Date(Date.now()),
			submissionip: String(req.headers['x-forwarded-for']) || req.connection.remoteAddress,
			responsedate: null,
			state: 'submission',
			rejectreason: null
		};

		if (oldver !== null) {
			// await mediaController.removeMediaList (oldver.media);
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

		/* End of upload phase */
		if (req.body.end && req.body.end === true) {
			ver.step = 2;
		}
		/* Upload new file */
		else {
			const data = await mediaController.uploadPrivate(req, res, user.username, {
				container: 'documents',
				filename: `NPO${user.username}_${(new Date()).getTime()}`,
				types: ['image', 'pdf']
			});

			if (data.image === null)
				return error.response(res, 'E');

			const medianame = data.body.name;
			if (['statute', 'memorandum', 'actofboard'].indexOf(medianame) == -1)
				return error.response(res, 'E');

			/* Overwrite old media if present */
			const oldmed = ver.medias.filter(m => { return m.name == medianame; });
			if (oldmed.length != 0) {
				await mediaController.removeMedia(oldmed[0].mid as any);
				ver.medias = ver.medias.filter(m => { return m.name != medianame; });
			}

			ver.medias.push({ mid: data.image._id, name: medianame });
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

	async NPOFinalize(req: any, res: Response, user: $UserDocument, ver: $Verification) {
		if (ver === null)
			return error.response(res, 'E');

		if (ver.medias.length < 3)
			return error.response(res, 'EV6');

		ver.step = 3;
		ver.state = 'pending';
		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});

			notificationController.done(req.username, 'noVerification');

			telegramHelper.notify(`Verification 'npodocuments' submitted by ${user.username} (${user.usertype}): pending approval`);
			mailHelper.send('info@helperbit.com', `[Verification] New pending 'npodocuments' verification from ${user.username} ${user.usertype}`,
				`Verification npodocuments submitted by ${user.username} (${user.usertype}): pending approval`);
		} catch (err) {
			return error.response(res, 'E');
		}
	}

	public getStep(i: number): (req: any, res: Response<any>, user: $UserDocument, ver: $Verification) => void {
		return [this.NPODocumentInfo, this.NPODocumentUpload, this.NPOFinalize][i];
	}
}
