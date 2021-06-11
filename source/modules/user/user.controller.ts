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

import path = require('path');
import { Request, Response, NextFunction } from "express";
import error = require('../../error');
import log = require('../../log');
import gis = require('../../gis');
import telegramHelper = require('../../helpers/telegram');
import schemaValidator = require('../../helpers/schema-validator');
import notificationController = require('../notification/notification.controller');
import mediaController = require('../media/media.controller');
import eventController = require('../event/event.controller');
import { $UserDocument, User, UserModel } from './user.model';
import { Event } from "../event/event.model";
import { QueryHelper } from "../../helpers/query";
import { getGeocoder } from "../../helpers/geocoder";

const moduleName = 'user';
const countryNames = require('../../data/country_names.json');
const country2char = require('../../data/country2char.json');


/* Middleware: Get the user, if any (middleware)
 * 	req.user: profile of the logged user || null
 */
export async function meLazy(req: any, res: Response, next: NextFunction) {
	if (req.username === null) {
		req.user = null;
		return next();
	}

	const user = await UserModel.getByUsername(req.username);
	req.user = user;
	next();
}


/* Middleware: Get the user, if any (middleware)
 * 	req.user: profile of the logged user || raise ('E1')
 */
export async function me(req: any, res: Response, next: NextFunction) {
	const user = await UserModel.getByUsername(req.username);
	if (user === null)
		return error.response(res, 'E1');

	req.user = user;
	next();
}


/* Middleware: Check if the user is on the allowed usertype list (middleware)
 * 	req.usertype: type of the user || raise ('E1')
 */
export function typeFilter(utypes: string[]) {
	return async (req: any, res: Response, next: NextFunction) => {
		const user = await UserModel.getByUsername(req.username, 'usertype username');
		if (utypes.indexOf(user.usertype) == -1)
			return error.response(res, 'E6');

		req.usertype = user.usertype;
		next();
	}
}


/* Middleware: Check if the user logged as social has email and password set */
export async function socialCompletness(req: any, res: Response, next: NextFunction) {
	const user = await User.findOne({ username: req.username, 'socialauth.status': { $ne: 'incomplete' } }, 'socialauth').exec();
	if (user === null)
		return error.response(res, 'E5');

	next();
};


/* Middleware: Check if the user has a trustlevel greater than minTrustLevel
 * E8 if the profile is not completed
 * E6 if wrong usertype
 */
export function trustFilter(minTrustLevel: any) {
	return async (req: any, res: Response, next: NextFunction) => {
		// const user = await UserModel.getByUsername(req.username, 'usertype trustlevel username');
		// let minTrustLevelSelected = 0;

		// if (user === null)
		// 	return error.response(res, 'E6');

		// if (typeof (minTrustLevel) == 'object' && user.usertype in minTrustLevel) {
		// 	minTrustLevelSelected = minTrustLevel[user.usertype];
		// } else if (typeof (minTrustLevel) == 'object' && !(user.usertype in minTrustLevel) && '*' in minTrustLevel) {
		// 	minTrustLevelSelected = minTrustLevel['*'];
		// } else if (typeof (minTrustLevel) == 'number') {
		// 	minTrustLevelSelected = minTrustLevel;
		// }

		// if (user.trustlevel < minTrustLevelSelected) {
		// 	return error.response(res, user.usertype == 'npo' ? 'E8' : 'E6');
		// }

		next();
	}
}


/* Middleware: check if the npo user has completed the signup process
 * E8 if the profile is not completed
 */
export async function npoStatus(req: any, res: Response, next: NextFunction) {
	const user: $UserDocument = await UserModel.getByUsername(req.username, 'receiveaddress trustlevel usertype');
	if (user.usertype != 'npo')
		return next();

	if (user.trustlevel < 50 || !schemaValidator.addressCheck(user.receiveaddress))
		return error.response(res, 'E8');
	else
		return next();
};



/* GET api/me */
export function profile(req: any, res: Response) {
	res.status(200);
	res.json(req.user.format(true));
}


/* DELETE api/me/media/avatar, api/me/media/cover */
export function removeMedia(mtype: string) {
	return async (req: any, res: Response) => {
		if (mtype == 'avatar' && req.user.avatar !== null) {
			await mediaController.removeMedia(req.user.avatar);
			req.user.avatar = null;
			req.user.updateTrust();
			await req.user.save();
		}
		else if (mtype == 'photo' && req.user.photo !== null) {
			await mediaController.removeMedia(req.user.photo);
			req.user.photo = null;
			req.user.updateTrust();
			await req.user.save();
		}

		res.status(200);
		res.json({});
	}
}

/* POST api/me/media/avatar, api/me/media/cover */
export function updateMedia(mtype: string) {
	return async (req: any, res: Response) => {
		let opts;

		if (mtype == 'photo')
			opts = { maxwidth: 1024, container: 'cover', filename: req.user.username };
		else if (mtype == 'avatar')
			opts = { maxwidth: 512, quad: true, container: 'avatar', filename: req.user.username };
		else
			return error.response(res, 'E');

		if (mtype == 'avatar' && req.user.avatar !== null) {
			await mediaController.removeMedia(req.user.avatar);
			req.user.avatar = null;
			req.user.updateTrust();
			await req.user.save();
		}
		else if (mtype == 'photo' && req.user.photo !== null) {
			await mediaController.removeMedia(req.user.photo);
			req.user.photo = null;
			req.user.updateTrust();
			await req.user.save();
		}

		const rim = await mediaController.upload(req, res, opts);

		if (rim.image) {
			if (mtype == 'avatar')
				req.user.avatar = rim.image._id;
			else
				req.user.photo = rim.image._id;

			req.user.updateTrust();
			await req.user.save();

			res.status(200);
			res.json({ id: rim.image._id });
		} else {
			if (mtype == 'avatar')
				req.user.avatar = null;
			else
				req.user.photo = null;

			req.user.updateTrust();
			await req.user.save();
			res.status(500);
			res.json({});
		}
	}
};

/* POST api/me */
export async function updateProfile(req: any, res: Response) {
	const user = req.user;

	if (user.checkLockViolation(req.body))
		return error.response(res, 'EV3');

	user.safeUpdate(req.body);

	/* If textual location is changed, use the geocoder */
	if (('country' in req.body && 'region' in req.body && 'street' in req.body && 'streetnr' in req.body &&
		'zipcode' in req.body && 'city' in req.body) && !('location' in req.body)) {
		try {
			const coord = await getGeocoder().geocode(`${user.street || ''} ${user.streetnr || ''}, ${user.city || ''}, ${user.region || ''}, ${countryNames[user.country] || ''}`);
			user.location = { type: 'Point', coordinates: [coord.long, coord.lat] };
			notificationController.done(user.username, 'noGeolocalization');
			await eventController.updateAffectedUsersAfterUserGeoloc(user);
		} catch (err) {
			log.critical(moduleName, `Can't guess location for ${user.username}: ${err}`, req);
			return error.response(res, 'EU2');
		}
	}
	/* Check if the insert position match the textual position */
	else if ('location' in req.body) {
		try {
			const data: any = await getGeocoder().reverse(user.location.coordinates[1], user.location.coordinates[0]);
			if (user.country != country2char[data.countryCode]) {
				user.country = country2char[data.countryCode];
				// user.street = '';
				// user.streetnr = '';
			}

			if ('administrativeLevels' in data && 
				'level1long' in data.administrativeLevels &&
				data.administrativeLevels.level1long && 
				user.region.toLowerCase() != data.administrativeLevels.level1long.toLowerCase()
			) {
				user.region = data.administrativeLevels.level1long;
				// user.street = '';
				// user.streetnr = '';
			}
			if (('city' in data && user.city.toLowerCase() != data.city.toLowerCase()) ||
				(!('city' in data) && 'level3long' in data.administrativeLevels && data.administrativeLevels.level3long.toLowerCase() != user.city.toLowerCase()) ||
				(!('city' in data) && !('level3long' in data) && ('level2long' in data.administrativeLevels) && data.administrativeLevels.level2long.toLowerCase() != user.city.toLowerCase())) {
				user.city = data.city || data.administrativeLevels.level3long || data.administrativeLevels.level2long;
				// user.street = '';
				// user.streetnr = '';
			}
			if ('zipcode' in data && user.zipcode != data.zipcode) {
				user.zipcode = data.zipcode;
			}
			if (user.countries.length == 0) {
				user.countries = [user.country];
			}

			await eventController.updateAffectedUsersAfterUserGeoloc(user);
			notificationController.done(user.username, 'noGeolocalization');
		} catch (err) {
			/* If the reverse geocoding fails, the user is in the sea, so we send back an error */
			log.error(moduleName, `Failed reverse geocoding: ${err}`);
			/* user.location.coordinates = [];
			await user.save();
			await eventController.updateAffectedUsersAfterUserGeoloc(user);
			return error.response (res, 'EU1');	*/

			return error.response(res, 'EU2');
		}
	}

	/* Update the risk level */
	if (user.location.coordinates.length >= 2) {
		try {
			const rlevel = await gis.getRiskLevel(user.location.coordinates[1], user.location.coordinates[0]);
			user.risk.earthquake.class = rlevel.earthquake.class || 'na';
			user.risk.earthquake.source = rlevel.earthquake.source || 'helperbit';
			user.risk.wildfire.class = rlevel.wildfire.class || 'na';
			user.risk.wildfire.source = rlevel.wildfire.source || 'helperbit';
			user.risk.flood.class = rlevel.flood.class || 'na';
			user.risk.flood.source = rlevel.flood.source || 'helperbit';
		} catch (err) { }
	}

	await user.save();
	res.status(200);
	res.json({});

	if ('location' in req.body) {
		telegramHelper.notify(`${moduleName} - ${user.username} updated its geolocalization`); // : ${user.country}`);
	}
};


/* GET api/user/:name */
export async function getByName(req: Request, res: Response) {
	const uname = req.params.name.toLowerCase();
	const user = await UserModel.getByUsername(uname);

	if (user !== null) {
		if (user.isBanned())
			return error.response(res, 'E2');

		res.status(200);
		res.json(user.format(false));
	} else {
		return error.response(res, 'E2');
	}
};


/* GET api/me/avatar | api/user/:name/avatar */
export async function avatar(req: any, res: Response) {
	let name = req.username;
	if ('name' in req.params)
		name = req.params.name;

	const user = await UserModel.getByUsername(name.toLowerCase(), 'avatar banned');

	if (!user || user.avatar === null || user.isBanned())
		return res.sendFile('avatar_empty.png', { root: path.join(__dirname, '../../data') });

	return mediaController.showThumbnail(req, res, user.avatar as any, 200);
};


/* GET api/me/events | api/user/:name/events */
export async function events(req: any, res: Response) {
	let name = req.username;
	if ('name' in req.params)
		name = req.params.name;

	const user: $UserDocument = await UserModel.getByUsername(name.toLowerCase());

	if (user === null ||
		(!user.isAnOrganization() && user.country === null || user.country === '') /* ||
				(user.usertype != 'singleuser' && user.countries.length == 0)*/) { /* TODO Countries is not populated */
		res.status(200);
		res.json({ events: [] });
		return;
	}

	let q = {};

	if (!user.isAnOrganization()) {
		q = { 'affectedcountries': user.country };
	} else if (user.countries.indexOf('WRL') == -1) {
		q = { 'affectedcountries': { $elemMatch: { $in: user.countries } } };
	}

	const events = await Event.find(q, '-affectedusers -geometry').sort({ 'lastshakedate': 'desc' }).limit(100).exec();
	res.status(200);
	res.json({ events: events });
};


/* GET/POST api/organizations/list */
export async function getOrganizationList(req: Request, res: Response) {
	const query = UserModel.queries.visualizableOrganizations(req.body.name || "");
	const organizations = await QueryHelper.pagination(req, User, {
		sort: 'desc',
		orderby: 'fullname',
		query: query,
		fields: 'username usertype subtype country received receiveddonations avatar fullname countries tags operators'
	});
	const orgn = await User.countDocuments(query).exec();
	res.status(200);
	res.json({ organizations: organizations, count: orgn });
};
