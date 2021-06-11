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
import mailHelper = require('../../../helpers/mail');
import telegramHelper = require('../../../helpers/telegram');
import { UserVerificationProvider } from "./userverificationprovider";

const supportedDocuments = ['id', 'passport'];

export class DocumentVerificationProvider extends UserVerificationProvider {
	constructor() {
		super('document', ['company', 'singleuser'], 3, [], { default: 25 });
	}

	async DocumentInfo(req: Request, res: Response, user: $UserDocument, oldver: $Verification) {
		if (req.body.document === null || supportedDocuments.indexOf(req.body.document) == -1 ||
			req.body.expirationdate === null || req.body.expirationdate === '' ||
			req.body.documentid === null || req.body.documentid === '')
			return error.response(res, 'E3');

		const ver: $Verification = {
			provider: 'document',
			medias: [],
			info: {
				document: req.body.document,
				expirationdate: new Date(req.body.expirationdate),
				documentid: req.body.documentid
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

	async DocumentMediaUpload(req: Request, res: Response, user: $UserDocument, ver: $Verification) {
		if (ver === null)
			return error.response(res, 'E');

		const data = await mediaController.uploadPrivate(req, res, user.username, {
			container: 'documents',
			filename: `ID${user.username}_${(new Date()).getTime()}`,
			types: ['image', 'pdf']
		});
		if (data.image === null)
			return error.response(res, 'E');

		const medianame = data.body.name;
		if (['front', 'back'].indexOf(medianame) == -1)
			return error.response(res, 'E');

		/* Overwrite old media if present */
		const oldmed = ver.medias.filter(m => { return m.name == medianame; });
		if (oldmed.length != 0) {
			await mediaController.removeMedia(oldmed[0].mid as any);
			ver.medias = ver.medias.filter(m => { return m.name != medianame; });
		}

		ver.medias.push({ mid: data.image._id, name: medianame });
		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});
		} catch (err) {
			return error.response(res, 'E');
		}
	}

	async DocumentFinalize(req: any, res: Response, user: $UserDocument, ver: $Verification) {
		if (ver === null)
			return error.response(res, 'E');

		if (ver.medias.length < 2)
			return error.response(res, 'EV6');

		ver.step = 2;
		ver.state = 'pending';
		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});

			notificationController.done(req.username, 'noVerification');

			telegramHelper.notify(`Verification 'documents' submitted by ${user.username} (${user.usertype}): pending approval`);
			mailHelper.send('info@helperbit.com', `[Verification] New pending 'documents' verification from ${user.username} ${user.usertype}`,
				`Verification documents submitted by ${user.username} (${user.usertype}): pending approval`);
		} catch (err) {
			return error.response(res, 'E');
		}
	}

	public getStep(i: number): (req: any, res: Response<any>, user: $UserDocument, ver: $Verification) => void {
		return [this.DocumentInfo, this.DocumentMediaUpload, this.DocumentFinalize][i];
	}
}
