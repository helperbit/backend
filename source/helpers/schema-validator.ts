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

import conf = require('../conf');
import multiparty = require('multiparty');
import * as bitcoinjs from 'bitcoinjs-lib';
import disposabledomains = require('disposable-email-domains');
import * as error from '../error';
import { Request, NextFunction } from 'express';

const country = require('../data/country.json');
const tags = require('../data/tags.json');

interface FieldSchema {
	type: string;
	error?: string;
	max?: number;
	min?: number;
	value?: any;
	required?: boolean;
}

export interface ValidationSchema {
	[fieldName: string]: FieldSchema;
}

export function addressCheck(address: string): boolean {
	if (address === undefined || address === null || typeof (address) != 'string' || address.length === 0)
		return false;

	try {
		bitcoinjs.address.toOutputScript(address, conf.blockchain.network);
		return true;
	} catch (e) {
		return false;
	}
}

export function mailCheck(email) {
	// var mail_re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
	const mail_re = /^([\w-+]+(?:\.[\w-+]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,8}(?:\.[a-z]{2})?)$/i;
	return mail_re.test(email);
}


export function domainOfSite(site: string): string {
	const r = /:\/\/(.[^/]+)/;
	const m = site.match(r);
	if (m && m.length > 0) {
		const s = m[1].split('.');
		return s[s.length - 2] + '.' + s[s.length - 1];
	} else {
		return '';
	}
}

export function mailDomainCheck(email: string, site: string): boolean {
	return domainOfSite(site) == email.split('@')[1];
}

/** Return true if the email is disposable */
export function mailDisposableCheck(email: string): boolean {
	const domain = email.split('@')[1];
	if (disposabledomains.indexOf(domain) != -1)
		return true;
	return false;
}


export function usernameCheck(username: string): boolean {
	const username_re = /^[0-9a-z_]+$/;
	return username_re.test(username);
}

export function vatCheck(vat: string): boolean {
	if (vat.length < 4 || vat.length > 32)
		return false;

	const username_re = /^[0-9a-z_]+$/;
	return username_re.test(vat);
}


/** Check sanity of input body
 * 
 * validationSchema: an object of rules
 *  { 
 * 		"required": false, 
 * 		"type": "string|object|number|mail|countrycode|username|array|boolean|mailoruser|money|currency|tags",
 * 		"subtype": "string|..." 
 * 		"min": "", 
 * 		"max": "",
 * 		"error": "E3",
 * 		"validator": (v) => { return true; }
 *  }
 * 
 * TODO: subtype check, custom checker, address type
 * 
 * return: sanitized input or false
 */
export function validateSchema(res: any, body: any, validationSchema: ValidationSchema): any {
	for (const field in validationSchema) {
		const sanity: FieldSchema = validationSchema[field];
		const errcode: string = sanity.error || 'E3';

		/* Missing required field */
		if ('required' in sanity && sanity.required && !(field in body))
			return error.response(res, errcode, { "name": field, "reason": "missing" });


		/* If the field is not required and not in body, continue to next */
		if (!(field in body))
			continue;

		/* Generic type match */
		let ftype = typeof (body[field]);

		/* Cast */
		if ('type' in sanity) {
			switch (sanity.type) {
				case 'number':
				case 'money':
					body[field] = parseFloat(body[field]);
					if (isNaN(body[field]))
						return null;

					break;
			}

			ftype = typeof (body[field]);
		}

		switch (ftype) {
			case 'string':
				if ('max' in sanity && body[field].length > sanity.max)
					return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "lbig", max: sanity.max });
				if ('min' in sanity && body[field].length < sanity.min)
					return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "lsmall", min: sanity.min });
				break;

			case 'number':
				if ('max' in sanity && body[field] > sanity.max)
					return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "big", max: sanity.max });
				if ('min' in sanity && body[field] < sanity.min)
					return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "small", min: sanity.min });
		}

		/* Stronger type constraint */
		if ('type' in sanity) {
			switch (sanity.type) {
				case 'tags':
					if (ftype !== 'object')
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });

					/* Remove not available tags */
					body[field] = body[field].filter(t => tags.indexOf(t) !== -1);
					/* Remove dups */
					body[field] = Array.from(new Set(body[field]));
					break;

				case 'currency':
					if (conf.currency.supported.indexOf(body[field].toUpperCase()) == -1)
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'vat':
					if (ftype != 'string' || !usernameCheck(body[field]))
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'mailorusername':
				case 'emailorusername':
					body[field] = body[field].toLowerCase();

					if (ftype != 'string' || (!mailCheck(body[field]) && !usernameCheck(body[field])))
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'email':
				case 'mail':
					body[field] = body[field].toLowerCase();

					if (ftype != 'string' || !mailCheck(body[field]))
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'country':
					body[field] = body[field].toUpperCase();

					if (ftype != 'string' || !(body[field] in country))
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'username':
					body[field] = body[field].toLowerCase();

					if (ftype != 'string' || !usernameCheck(body[field]))
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'tstring':
					if (ftype != 'object')
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });

					if ('min' in sanity) {
						let check = false;
						for (const lang in body[field]) {
							if (body[field][lang] != null && body[field][lang].length > sanity['min']) {
								check = true;
							}
						}
						if (!check)
							return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "lsmall", max: sanity.min });
					}
					if ('max' in sanity) {
						for (const lang in body[field]) {
							if (body[field][lang] != null && body[field][lang].length > sanity['max'])
								return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "big", max: sanity.max });
						}
					}
					break;

				case 'dict':
					if (ftype != 'object')
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });

					if (Object.keys(body[field]).length > (sanity.max || 16))
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });

					if (JSON.stringify(body[field]).length > 1024)
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });

					break;


				case 'string':
					if (ftype != 'string')
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'number':
				case 'money':
					if (ftype != 'number')
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'object':
				case 'array':
					if (ftype != 'object')
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;

				case 'boolean':
					if (ftype != 'boolean')
						return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "invalid" });
					break;
			}
		}

		/* Exact value */
		if ('value' in sanity && body[field] != sanity.value)
			return error.response(res, errcode, { "name": field, "type": sanity.type, "reason": "notmatch", value: sanity.value });
	}

	return body;
}


/* Middleware: sanity checks || raise ('E3') */
export function validateGet(validationSchema: ValidationSchema) {
	return (req: Request, res: Response, next: NextFunction) => {
		const nbody = validateSchema(res, req.query, validationSchema);

		if (nbody == false || nbody == null)
			return;
		else {
			req.query = nbody;
			return next();
		}
	};
}


/* Middleware: sanity checks || raise ('E3') */
export function validate(validationSchema: ValidationSchema) {
	return (req: Request, res: Response, next: NextFunction) => {
		const nbody = validateSchema(res, req.body, validationSchema);

		if (nbody == false || nbody == null)
			return;
		else {
			req.body = nbody;
			return next();
		}
	};
}


/* Middleware: parse content disposition fields as body */
/* Not usable, it breaks the form */
export function parseContentDisposition(req: Request, res: Response, next: NextFunction) {
	const form = new multiparty.Form();
	form.parse(req, (err, fields, files) => {
		if (fields !== undefined) {
			const keys = Object.keys(fields);

			for (let i = 0; i < keys.length; i++) {
				req.body[keys[i]] = fields[keys[i]][0];
			}
		}

		next();
	});
}
