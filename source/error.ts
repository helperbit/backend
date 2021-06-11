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

import log = require('./log');
import { Response, Request } from 'express';
import conf = require('./conf');
// import telegramHelper = require('./helpers/telegram');


export interface ErrorData {
	name?: string;
	reason?: string;
	type?: string;
	[param: string]: number | string | any;
}

export interface Error {
	message: string;
	error: string;
	data?: ErrorData;
}

const errors = {
	/* Common */
	"E": { message: "generic error", code: 500 },
	"E1": { message: "you are not authenticated", code: 401 },
	"E2": { message: "resource not found", code: 404 },
	"E3": { message: "invalid parameters", code: 500 },
	"E4": { message: "not yet impemented", code: 500 },
	"E5": { message: "incomplete social profile", code: 401 },
	"E6": { message: "not authorized", code: 401 },
	"E7": { message: "invalid captcha", code: 401 },
	"E8": { message: "npo profile not completed", code: 401 },
	"E9": { message: "wrong email domain", code: 500 },

	/* Campaign */
	"EC1": { message: "you already have a running campaign", code: 500 },
	"EC2": { message: "can't delete a running campaign", code: 500 },
	"EC3": { message: "campaign info are not yet completed", code: 500 },
	"EC4": { message: "invalid resource", code: 500 },
	"EC5": { message: "above max target", code: 500 },
	"EC6": { message: "can't edit a concluded campaign", code: 500 },

	/* Donation */

	/* Auth */
	"EA1": { message: "invalid activation url", code: 500 },
	"EA2": { message: "an account is already associated to this social id", code: 500 },
	"EA3": { message: "account not active", code: 500 },
	"EA4": { message: "admin not allowed", code: 500 },
	"EA5": { message: "banned", code: 500 },

	/* Alert */
	"EAL1": { message: "already sent an alert in this week", code: 500 },
	"EAL2": { message: "you are not geolocalized", code: 500 },

	/* Most wanted NPO */
	"EMWN1": { message: "your IP have already endorsed this NPO", code: 500 },
	"EMWN2": { message: "you have already endorsed this NPO", code: 500 },
	"EMWN3": { message: "organization already proposed", code: 500 },

	/* ROR */
	"EROR1": { message: "there are already rors pending", code: 500 },
	"EROR2": { message: "can't create a ror with this user", code: 500 },
	"EROR3": { message: "can't delete this ror", code: 500 },
	"EROR4": { message: "no receive address", code: 500 },

	/* Reset */
	"ER1": { message: "this email is not associated to any account", code: 500 },
	"ER2": { message: "invalid reset link", code: 500 },
	"ER3": { message: "expired reset link", code: 500 },

	/* Media */
	"EM1": { message: "invalid format", code: 500 },
	"EM2": { message: "file is above max size", code: 500 },
	"EM3": { message: "media not found", code: 500 },
	"EM4": { message: "no content type", code: 500 },
	"EM5": { message: "", code: 500 },
	"EM6": { message: "invalid file", code: 500 },

	/* Faucet */
	"EF1": { message: "no faucet funds available", code: 500 },
	"EF2": { message: "wallet not empty", code: 500 },
	"EF3": { message: "unknown error", code: 500 },

	/* Wallet */
	"EW1": { message: "not enough funds", code: 500 },
	"EW2": { message: "bad address", code: 500 },
	"EW4": { message: "no users selected", code: 500 },
	"EW5": { message: "transaction not sent", code: 500 },
	"EW6": { message: "max 10 addresses allowed", code: 500 },
	"EW10": { message: "multisig wallets need at least n admin users", code: 500 },
	"EW11": { message: "multisig wallets need at least 3 signatures", code: 500 },
	"EW12": { message: "completed multisig wallets cannot be deleted", code: 500 },
	"EW13": { message: "this admin belong to a wallet", code: 500 },
	"EW14": { message: "multisig wallets can have maximum 10 admins", code: 500 },
	"EW15": { message: "duplicate public key", code: 500 },

	/* Wallet verify */
	"EWV1": { message: "already a verification in creation or signing", code: 500 },

	/* Projects */
	"EP1": { message: "wrong wallet selected", code: 500 },
	"EP2": { message: "this event is already associated with one of your projects", code: 500 },
	"EP3": { message: "this event is not in your organization area", code: 500 },
	"EP6": { message: "project has donations", code: 500 },
	"EP8": { message: "too many media", code: 500 },

	/* Signup */
	"ES1": { message: "username already taken", code: 500 },
	"ES2": { message: "email already taken", code: 500 },
	"ES4": { message: "password should be at least 8 character long", code: 500 },
	"ES5": { message: "disposable email domain are not allowed", code: 500 },

	/* Login */
	"EL1": { message: "wrong email / password combination", code: 401 },
	"EL2": { message: "you typed wrong credentials too many times; wait 5 minutes", code: 402 },
	"EL3": { message: "your email address is not yet verified", code: 402 },

	/* Verification */
	"EV1": { message: "incomplete profile", code: 500 },
	"EV2": { message: "not available for your user type", code: 500 },
	"EV3": { message: "locked fields not editable", code: 500 },
	"EV4": { message: "invalid OTC", code: 500 },
	"EV5": { message: "position mismatch", code: 500 },
	"EV6": { message: "incomplete verification", code: 500 },
	"EV7": { message: "already pending verification", code: 500 },

	/* User data edit */
	"EU1": { message: "can't geolocalize in the sea", code: 500 },
	"EU2": { message: "invalid address", code: 500 }
};


export function get(err: string, data?: ErrorData): Error {
	let e: { message: string; code: number } = errors[err];
	if (!e) e = errors.E;

	const ee: Error = { error: err, message: e.message };

	if (data !== undefined)
		ee.data = data;

	return ee;
}


export function response(res: Response & { username?: string; ip?: string }, err: string, data?: ErrorData): boolean {
	let e: { message: string; code: number } = errors[err];
	const resu: unknown = res;
	if (!e) e = errors.E;

	const ee: Error = { error: err, message: e.message };

	if (data !== undefined)
		ee.data = data;

	res.status(e.code);
	res.json(ee);

	if (conf.debug)
		log.debug('error', `${err} - ${e.message} (${res.username || 'noauth'}, ${res.ip})`, (resu as Request));

	// if (err != 'E5' && err != 'E1')
	//	telegramHelper.notify (`Error ${err}: ${e.message} [${res.username}]`, res);

	return false;
}

export function rawresponse(res: any, message: string): boolean {
	const ee: Error = { error: 'E', message: message };

	res.status(500);
	res.json(ee);

	return false;
}
