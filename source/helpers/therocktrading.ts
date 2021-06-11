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
import crypto = require('crypto');
import conf = require('../conf');

let hostapi = 'https://api.therocktrading.com/v1/';

if (conf.blockchain.testnet) {
	hostapi = 'https://api-staging.therocktrading.com/v1/';

	/* This disable HTTPS check, used for tinkl staging API */
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}


/* Prepare headers with HMAC signature */
interface Headers { 
	'Content-Type': string; 
	'X-TRT-KEY': string; 
	'X-TRT-SIGN': string; 
	'X-TRT-NONCE': number;
}

function prepareHeaders(uri: string): Headers {
	const nonce = new Date().getTime();
	const hmac = crypto.createHmac('sha512', conf.api.therocktrading.secret);

	hmac.update('' + nonce + uri);

	return {
		'Content-Type': 'application/json',
		'X-TRT-KEY': conf.api.therocktrading.key,
		'X-TRT-SIGN': hmac.digest('hex'),
		'X-TRT-NONCE': nonce
	};
}


/** Get the ticker for BTCEUR */
interface Ticker { bid: number; ask: number; last: number }

export function getTicker(currency: string): Promise<Ticker> {
	const uri = hostapi + 'funds/BTC' + currency + '/ticker';
	return request({ url: uri, json: true, headers: { 'Content-Type': 'application/json' } });
}


/** Return the balance of the given currency */
interface Balance { currency: string; balance: number; trading_balance: number }

export function getBalance(currency: string): Promise<Balance> {
	const uri = hostapi + 'balances/' + currency;
	return request({ url: uri, json: true, headers: prepareHeaders(uri) });
}


/** Place a new order currencyBTC of total amount currency */
interface Order {
	id: number;
	status: string; // active|conditional|executed|deleted
}

export function placeOrder(currency: string, amount: number, price: string): Promise<Order> {
	const body = {
		fund_id: 'BTC' + currency,
		side: 'buy',
		amount: amount,
		price: price

	};
	const uri = hostapi + 'funds/BTC' + currency + '/orders';
	return request({ method: 'POST', url: uri, body: body, json: true, headers: prepareHeaders(uri) });
}


/** Get open order status */
export function checkOrder(currency: string, orderid: string): Promise<Order> {
	const uri = hostapi + 'funds/BTC' + currency + '/orders/' + orderid;

	return request({ url: uri, json: true, headers: prepareHeaders(uri) });
}


/** Cancel an open order */
export function cancelOrder(currency: string, orderid: string): Promise<{ order: Order }> {
	const uri = hostapi + 'funds/BTC' + currency + '/orders/' + orderid;

	return request({ method: 'DELETE', url: uri, json: true, headers: prepareHeaders(uri) });
}


/** Withdraw Bitcoin to the given address */
export function createWithdraw(amount: number, address: string): Promise<{ transaction_id: string }> {
	const body = {
		destination_address: address,
		currency: 'BTC',
		amount: amount
	};

	const uri = hostapi + 'atms/withdraw';
	return request({ method: 'POST', url: uri, body: body, json: true, headers: prepareHeaders(uri) });
}


/** Get withdraw status */
interface Transaction { transfer_detail: { id: string } }

export function checkWithdraw(transactionid: string): Promise<Transaction> {
	const uri = hostapi + 'transactions/' + transactionid;
	return request({ url: uri, json: true, headers: prepareHeaders(uri) });
}


/* visualizza balance degli exchange sull'admin */

// exchange (FD) (promise)
// 
