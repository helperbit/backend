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
import { requestTyped, requestPostTyped } from './request-typed';
// import error = require('../error');
// import conf = require('../conf');

const uri = 'https://flyp.me/api/v1';
const headers = { 'Content-Type': 'application/json' };

/** Place an order */
interface OrderInfo {
	expires: number;
	deposit_address: string;
	txid?: string;
	order: {
		to_currency: string;
		uuid: string;
		invoiced_amount: string;
		destination: string;
		exchange_rate: string;
		ordered_amount: string;
		from_currency: string;
		status: string;
		payment_status: string;
	};
}

export async function acceptOrder(orderId: string): Promise<OrderInfo> {
	return requestPostTyped<OrderInfo>({
		url: `${uri}/order/accept`,
		body: { "uuid": orderId },
		headers: headers
	});
}

export async function createOrder(currency: string, amount: number, destination: string): Promise<OrderInfo> {
	const body = {
		order: {
			from_currency: currency,
			to_currency: 'BTC',
			ordered_amount: amount,
			destination: destination
		}
	};

	try {
		const r = await requestPostTyped<{
			errors?: any;
			order: { uuid: string };
		}>({ url: `${uri}/order/new`, body: body, headers: headers });
		if ('errors' in r)
			return Promise.reject(r);

		return await acceptOrder(r.order.uuid);
	} catch (err) {
		return Promise.reject(err);
	}
}


export function setRefundAddress(orderId: string, refund_address: string): Promise<{ result: string }> {
	return requestPostTyped<{ result: string }>({
		url: `${uri}/order/addrefund`,
		body: { "uuid": orderId, "address": refund_address },
		headers: headers
	});
}


/** Check the order status */
interface OrderStatus { status: string; confirmations?: string }
export function checkOrder(orderId: string): Promise<OrderStatus> {
	return requestPostTyped<OrderStatus>({ 
		url: `${uri}/order/check`, body: { "uuid": orderId }, headers: headers });
}


/** Get order status */
export function getOrderInfo(orderId: string): Promise<OrderInfo> {
	return requestPostTyped<OrderInfo>({ 
		url: `${uri}/order/info`, body: { "uuid": orderId }, headers: headers });
}


/** Cancel an open order */
export async function cancelOrder(orderId: string): Promise<boolean> {
	try {
		const r = await requestPostTyped<{result: boolean}>({ 
			url: `${uri}/order/cancel`, body: { "uuid": orderId }, headers: headers });
		return r.result;
	} catch (err) { return Promise.reject(err); }
}


/** Get flypme rates */
export function rates(): Promise<any> {
	return request({ method: 'GET', url: `${uri}/data/exchange_rates`, json: true, headers: headers });
}


/** Get flypme limits */
export interface FlypmeLimits {
	[currency: string]: {
		max: number;
		min: number;
	};
}

export function limits(): Promise<FlypmeLimits> {
	return requestPostTyped<FlypmeLimits>({ 
		url: `${uri}/order/limits`, body: {}, headers: headers });
}
