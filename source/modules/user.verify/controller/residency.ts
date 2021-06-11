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
import mailHelper = require('../../../helpers/mail');
import telegramHelper = require('../../../helpers/telegram');
import { UserVerificationProvider } from "./userverificationprovider";


export class ResidencyVerificationProvider extends UserVerificationProvider {
	constructor() {
		super('residency', ['singleuser'], 1, [], { default: 15 });
	}
	
	async ResidencyUploadStep(req: Request, res: Response, user: $UserDocument, oldver: $Verification) {
		if (oldver !== null)
			return error.response(res, 'EV7');

		const data = await mediaController.uploadPrivate(req, res, user.username, {
			container: 'documents',
			filename: `RES${user.username}_${(new Date()).getTime()}`,
			types: ['image', 'pdf']
		});

		if (data.image === null)
			return error.response(res, 'E');

		const ver = {
			provider: 'residency',
			medias: [{ name: "residency", mid: data.image._id }],
			info: {},
			step: 1,

			submissiondate: new Date(Date.now()),
			submissionip: String(req.headers['x-forwarded-for']) || req.connection.remoteAddress,
			responsedate: null,
			state: 'pending',
			rejectreason: null
		};

		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});

			telegramHelper.notify(`Verification 'residency' submitted by ${user.username} (${user.usertype}): pending approval`);
			mailHelper.send('info@helperbit.com', `[Verification] New pending 'residency' verification from ${user.username} ${user.usertype}`,
				`Verification residency submitted by ${user.username} (${user.usertype}): pending approval`);
		} catch (err) {
			return error.response(res, 'E');
		}
	}

	public getStep(i: number): (req: any, res: Response<any>, user: $UserDocument, ver: $Verification) => void {
		return [this.ResidencyUploadStep][i];
	}
}
