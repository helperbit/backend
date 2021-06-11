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
import schemaValidatorHelper = require('../../../helpers/schema-validator');
import geometryHelper = require('../../../helpers/geometry');
import { UserVerificationProvider } from "./userverificationprovider";


export class GPSVerificationProvider extends UserVerificationProvider {
	constructor() {
		super('gps', ['singleuser'], 1, [], { default: 5 });
	}

	async GPSSubmit(req: Request, res: Response, user: $UserDocument, oldver: $Verification) {
		req.body = schemaValidatorHelper.validateSchema(res, req.body, {
			lat: { required: true, type: 'number' },
			lon: { required: true, type: 'number' }
		});

		if (req.body === null)
			return error.response(res, 'E3');

		/* Check coordinates */
		const dist = geometryHelper.pointDistance([req.body.lon, req.body.lat], user.location.coordinates);

		if (dist >= 20.0)
			return error.response(res, 'EV5');

		const ver = {
			provider: 'gps',
			medias: [],
			info: {
				lat: req.body.lat,
				lon: req.body.lon
			},
			step: 1,

			submissiondate: new Date(Date.now()),
			submissionip: String(req.headers['x-forwarded-for']) || req.connection.remoteAddress,
			responsedate: new Date(Date.now()),
			state: 'accepted',
			rejectreason: null
		};

		user.updateVerification(ver);

		try {
			await user.save();
			res.status(200);
			res.json({});
		} catch (err) {
			return error.response(res, 'E');
		}
	}

	public getStep(i: number): (req: any, res: Response<any>, user: $UserDocument, ver: $Verification) => void {
		return [this.GPSSubmit][i];
	}
}
