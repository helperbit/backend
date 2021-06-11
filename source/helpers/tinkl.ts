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

import request = require('request-promise-native');
import conf = require('../conf');
import { $UserDocument } from '../modules/user/user.model';
import { validateSchema } from './schema-validator';
const countryNames = require('../data/country_names');

interface TinklPair {
	client_id: string;
	token: string;
}

let host = 'https://www.tinkl.it/v1/';
let hostapi = 'https://api.tinkl.it/v1/';

if (conf.blockchain.testnet) {
	host = 'https://staging.tinkl.it/v1/';
	hostapi = 'https://api-staging.tinkl.it/v1/';

	/* This disable HTTPS check, used for tinkl staging API */
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const headers = {
	'Content-Type': 'application/json',
	'X-CLIENT-ID': conf.api.tinklit.clientid,
	'X-AUTH-TOKEN': conf.api.tinklit.token
};



async function getAccount(uid: string) {
	return request({ url: host + 'merchants/' + uid, json: true, headers: headers });
}


async function createClient(uid: string) {
	const data = await request({ method: 'POST', url: host + 'merchants/' + uid + '/clients', body: { client_name: 'hb donations', token_role: 'pos' }, json: true, headers: headers });
	if ('errors' in data)
		return Promise.reject();

	return { client_id: data.client.sin, token: data.token.uuid };
}


async function getClientPair(uid: string) {
	const data = await request({ url: host + 'merchants/' + uid + '/clients', json: true, headers: headers });
	if ('errors' in data || data.clients.length === 0)
		return Promise.reject();

	return { client_id: data.clients[0].sin, token: data.clients[0].tokens[0].uuid };
}


async function createAccount(email: string, username: string, password: string) {
	const data = await request({ method: 'POST', url: host + 'merchants', body: { email: email, username: username, password: password, password_confirmation: password, terms: true }, json: true, headers: headers });
	if ('errors' in data)
		return Promise.reject();

	return data.uuid;
}


export interface TinklUpdateData {
	contact_name: string;
	contact_email: string;
	contact_phone: string;
	vat: string;
	iban: string;
	bic: string;
	bank: string;
}

async function updateAccount(uid: string, user: $UserDocument, hbody: TinklUpdateData) {
	const body = {
		name: user.fullname,
		address: user.street,
		zip: user.zipcode,
		company_name: user.fullname,
		country: countryNames[user.country],
		city: user.city,

		contact_name: hbody.contact_name,
		contact_email: hbody.contact_email,
		contact_phone_number: hbody.contact_phone,

		vat: hbody.vat,
		iban: hbody.iban,
		bic: hbody.bic,
		bankname: hbody.bank,

		service_acceptance: true,
		privacy_acceptance: true,
		commercial_acceptance: true
	};

	const data = await request({ method: 'PATCH', url: host + 'merchants/' + uid, body: body, json: true, headers: headers });
	if ('errors' in data)
		return Promise.reject();

	return uid;
}


async function listInvoices(pair: TinklPair) {
	const iheaders = {
		'Content-Type': 'application/json',
		'X-CLIENT-ID': pair.client_id,
		'X-AUTH-TOKEN': pair.token
	};

	return request({ url: hostapi + 'invoices', json: true, headers: iheaders });
}


async function createInvoice(pair: TinklPair, amount: number) {
	/* Call get client pair here */

	const body = { price: amount, item_code: "donation", currency: 'BTC' };
	const iheaders = {
		'Content-Type': 'application/json',
		'X-CLIENT-ID': pair.client_id,
		'X-AUTH-TOKEN': pair.token
	};

	const data = await request({ method: 'POST', url: hostapi + 'invoices', body: body, json: true, headers: iheaders });
	if ('errors' in data && data.errors.length !== 0)
		return Promise.reject(data.errors);

	return data;
}



// /* Get a new address for receive "amount" of donation */
// export async function getAddress(user: $UserDocument, amount: number): Promise<string>{
// 	let pair = null;

// 	if ('pair' in user.convert.data) {
// 		pair = user.convert.data.pair;
// 	} else {
// 		pair = await getClientPair(user.convert.data.uid);
// 	}

// 	let result = await createInvoice(pair, amount);
// 	return result.btc_address;
// };

// /* Update the provier data */
// export async function update (user: $UserDocument, body, res: Response) {
// 	body = validateSchema(res, body,
// 		{
// 			bic: { required: true, type: 'string', min: 8, max: 11 },
// 			iban: { required: true, type: 'string', min: 27, max: 27 },
// 			vat: { required: true, type: 'vat', min: 3, max: 12 },
// 			bank: { required: true, type: 'string', min: 3, max: 32 },
// 			contact_name: { required: true, type: 'string', min: 3 },
// 			contact_phone: { required: true, type: 'string', min: 5 },
// 			contact_email: { required: true, type: 'email' }
// 		}
// 	);

// 	if (body === null)
// 		return;

// 	if (user.convert.status != 'disabled')
// 		return error.response(res, 'E');

// 	user.convert.status = 'inprogress';
// 	user.convert.provider = 'tinkl';

// 	let uid = null;

// 	try {
// 		uid = await createAccount(Math.random() + user.email, Math.random() + user.username, body.password);
// 		uid = await updateAccount(uid, user, body);
// 	} catch (err) {
// 		return error.response(res, 'E');
// 	}

// 	user.convert.data = {
// 		bic: body.bic,
// 		iban: body.iban,
// 		vat: body.vat,
// 		uid: uid,
// 		bank: body.bank,
// 		contact_name: body.contact_name,
// 		contact_email: body.contact_email,
// 		contact_phone: body.contact_phone
// 	};

// 	await user.save();
// 	res.status(200);
// 	res.json({});
// 	return;
// }




// export async function checkStatus (user: $UserDocument): Promise<boolean> {
// 	if (user.convert.status != 'inprogress')
// 		return false;

// 	let result = await getAccount(user.convert.data.uid);
// 	if (result.status != 'active')
// 		return false;

// 	let pair = null;
// 	try {
// 		pair = await createClient(user.convert.data.uid);
// 	} catch (err) {
// 		return false;
// 	}

// 	user.convert.status = 'enabled';
// 	user.convert.data.pair = pair;
// 	user.markModified('convert.data');

// 	await user.save();
// 	return true;
// }
