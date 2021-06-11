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

import moment = require('moment');
import error = require('../../error');
import mediaController = require('../media/media.controller');

import { Response, Request } from 'express';
import { UserModel } from '../user/user.model';
import { Alert } from './alert.model';

/* api/me/alert/:id/media */
export async function insertMedia(req: any, res: Response) {
	const alid = req.params.id;

	const alert = await Alert.findOne({ user: req.username, _id: alid }).exec();
	if (alert === null)
		return error.response(res, 'E');

	if (alert.media !== null)
		await mediaController.removeMedia(alert.media as any);

	const data = await mediaController.upload(req, res, { maxwidth: 800, quad: false, container: 'alert', filename: '' + alid });
	res.status(200);
	res.json({});
};


/* api/me/alert */
export async function insert(req: any, res: Response) {
	const alertcount = await Alert.countDocuments({ user: req.username, time: { $gte: moment().subtract(7, 'day').format() } }).exec();

	if (alertcount > 0)
		return error.response(res, 'EAL1');

	const user = await UserModel.getByUsername(req.username, 'location trustlevel');

	if (user === null)
		return error.response(res, 'E');

	if (user.location.coordinates.length < 2)
		return error.response(res, 'EAL2');

	const alert = new Alert();
	alert.description = req.body.description || '';
	alert.type = req.body.type;
	alert.weight = user.trustlevel / 100.0;
	alert.user = req.username;
	alert.position = user.location;

	try {
		await alert.save();
		res.status(200);
		res.json({ id: alert._id });
	} catch (err) {
		error.response(res, 'E');
	}
}


/* api/me/alerts */
export async function getList(req: any, res: Response) {
	const alerts = await Alert.find({ user: req.username }, 'description time type media').exec();

	res.status(200);
	res.json({ alerts: alerts });
}
