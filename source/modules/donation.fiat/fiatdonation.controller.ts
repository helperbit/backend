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
import { Blockchain } from "../../blockchain";
import error = require('../../error');
import log = require('../../log');
import conf = require('../../conf');
import telegramHelper = require('../../helpers/telegram');

import { UserModel } from "../user/user.model";
import { Project } from "../project/project.model";
import { FiatDonation } from "./fiatdonation.model";
import { sha1 } from "../../helpers/crypto";

const exchanges = {
	therocktrading: require('../../helpers/therocktrading')
};


export function getExchange(name: string) {
	return exchanges[name];
}

export async function paymentCallback(req: Request, res: Response) {
	const provider = req.params.provider;
	let destuser = req.body.order_reference;

	if (provider != 'mistralpay')
		return error.response(res, 'E');


	/* TODO effetua check input */
	/* body = schemaValidatorHelper.validateSchema (res, body,
		{
			bic: { required: true, type: 'string', min: 8, max: 11 },
			iban: { required: true, type: 'string', min: 27, max: 27 },
			vat: { required: true, type: 'vat', min: 3, max: 12 },
			bank: { required: true, type: 'string', min: 3, max: 32 },
			contact_name: { required: true, type: 'string', min: 3 },
			contact_phone: { required: true, type: 'string', min: 5 },
			contact_email: { required: true, type: 'email' }
		}
    );*/

	/*
    mistralpay { transaction: '722CF35656AX696D',
    order_reference: 'legambiente',
    amount: '5.00',
    currency: 'EUR',
    token: '4d927265b4b502bd9c37c0f5935a17278476785a',
    customer_email: 'dagide91@gmail.com',
    response: 'OK',
    customer_name: 'Davide Gessa' } {} { provider: 'mistralpay' }
    custom1 : valuebtc
	custom2: username
	custom3: campaign
	custom4: restype|resid
	custom5: giftdata
    */

	/* Check the token */
	const tokdata = req.body.currency + req.body.amount + req.body.transaction + conf.api.mistralpay.account + conf.api.mistralpay.token;

	if (sha1(tokdata) != req.body.token) {
		log.debug('FiatDonation', `Callback called with invalid token: ${req.body}`);
		return error.response(res, 'E');
	}


	/* Find destination user */
	let address = null;

	const splittedRes = req.body.custom4.split('|');
	if (splittedRes && splittedRes.length == 2 && splittedRes[0] == 'project') {
		const project = await Project.findOne({ _id: splittedRes[1] }, 'receiveaddress owner').exec();
		address = project.receiveaddress;
		destuser = project.owner;
	}

	/* Reminder: this also handles old projects where receiveaddress is null */
	if (address == null) {
		const user = await UserModel.getByUsername(destuser, 'receiveaddress');
		address = user.receiveaddress;
	}

	const fd = new FiatDonation();

	fd.provider = provider;
	fd.exchange = 'therocktrading';

	if (req.body.response == 'OK' && address == null) {
		fd.status = 'paidtowronguser';
	} else if (req.body.response == 'OK') {
		fd.status = 'paid';
		fd.toaddress = address;
	} else {
		log.debug('Failed payment:', req.body);
		fd.status = 'failedpayment';
		fd.toaddress = address;
	}

	fd.touser = destuser;
	fd.currency = req.body.currency;
	fd.value = req.body.amount;
	fd.email = req.body.customer_email;
	fd.fullname = req.body.customer_name;
	fd.valuebtc = req.body.custom1;

	fd.paymentdata = {
		transaction: req.body.transaction,
		token: req.body.token
	};

	// custom3 contains the campaign
	if (req.body.custom3)
		fd.campaign = req.body.custom3;

	// custom2 contains the user
	if (req.body.custom2.length > 3) {
		fd.username = req.body.custom2;
	}

	// custom5 contains gift data 
	if (req.body.custom5) {
		const giftSplit = req.body.custom5.split('|');
		if (giftSplit.length >= 3) {
			fd.gift.name = giftSplit[0];
			fd.gift.email = giftSplit[1];
			fd.gift.name = giftSplit[2];
			fd.gift.enabled = true;
		}
	}

	/* Check if valuebtc is ok */
	try {
		const prices = await Blockchain.getPrices();
		// if (fd.currency == 'EUR') {
		/* Percentage threshold is 5% */
		if (fd.valuebtc > (fd.value / (prices.eur - prices.eur * 5 / 100))) {
			fd.status = 'paidinvalidbtc';
		}

		switch (fd.status) {
			case 'paid':
				fd.refillstatus = 'pending';
				log.debug('FiatDonation', `New fiat donation of ${fd.value}${fd.currency} (${fd.valuebtc} BTC) from ${fd.email} ${fd.fullname} to ${fd.touser} (id: ${fd._id})`);
				break;
			case 'failedpayment':
				log.debug('FiatDonation', `Failed fiat donation of ${fd.value}${fd.currency} (${fd.valuebtc} BTC) from ${fd.email} ${fd.fullname} to ${fd.touser} (id: ${fd._id})`);
				break;
			case 'paidtowronguser':
				log.debug('FiatDonation', `Paid but wrong user fiat donation of ${fd.value}${fd.currency} (${fd.valuebtc} BTC) from ${fd.email} ${fd.fullname} to ${fd.touser} (id: ${fd._id})`);
				break;
			case 'paidinvalidbtc':
				log.debug('FiatDonation', `Paid but invalid btc amount for fiat donation of ${fd.value}${fd.currency} (${fd.valuebtc} BTC) from ${fd.email} ${fd.fullname} to ${fd.touser} (id: ${fd._id})`);
				break;
		}

		try {
			await fd.save();
			log.debug('FiatDonation', `Saved`);

			switch (fd.status) {
				case 'paid':
					fd.refillstatus = 'pending';
					telegramHelper.notify(`New fiat donation of ${fd.value}${fd.currency} (${fd.valuebtc} BTC) from ${fd.email} ${fd.fullname} to ${fd.touser} (id: ${fd._id})`);
					break;
				case 'failedpayment':
					telegramHelper.notify(`Failed fiat donation of ${fd.value}${fd.currency} (${fd.valuebtc} BTC) from ${fd.email} ${fd.fullname} to ${fd.touser} (id: ${fd._id})`);
					break;
				case 'paidtowronguser':
					telegramHelper.notify(`Paid but wrong user fiat donation of ${fd.value}${fd.currency} (${fd.valuebtc} BTC) from ${fd.email} ${fd.fullname} to ${fd.touser} (id: ${fd._id})`);
					break;
				case 'paidinvalidbtc':
					telegramHelper.notify(`Paid but invalid btc amount for fiat donation of ${fd.value}${fd.currency} (${fd.valuebtc} BTC) from ${fd.email} ${fd.fullname} to ${fd.touser} (id: ${fd._id})`);
					break;
			}

			res.status(200);
			res.json({});
		} catch (err) {
			log.critical('FiatDonation', `Not saved: ${err} (id: ${fd._id})`);
			error.response(res, 'E');
		}
	} catch (err) {
		fd.status = 'paidcheckfailed';

		try {
			await fd.save();
			log.debug('FiatDonation', `Saved (id: ${fd._id})`);

			res.status(200);
			res.json({});
		} catch (err) {
			log.critical('FiatDonation', `Not saved: ${err} (id: ${fd._id})`);
			return error.response(res, 'E');
		}
	}
}
