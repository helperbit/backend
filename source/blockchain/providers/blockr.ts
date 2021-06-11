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

// import request = require('request-promise-native');
// import conf = require('../../conf');
// import log = require('../../log');

// exports.name = 'Blockr.io';

// let host = 'https://btc.blockr.io';
// const endpoints = {
// 	balance: "/api/v1/address/balance/",
// 	address: "/api/v1/address/info/",
// 	unspent: "/api/v1/address/unspent/",
// 	push: "/api/v1/tx/push",
// 	tx: "/api/v1/tx/info/",
// 	txs: "/api/v1/address/txs/",
// 	height: "/api/v1/block/info/last"
// };


// let param = '';
// if (conf.blockchain.limits.min.conf === 0)
// 	param = '?unconfirmed=1';
// if (conf.blockchain.testnet)
// 	host = 'https://tbtc.blockr.io';


// exports.isNetworkSupported = (): boolean => {
// 	return true;
// };


// exports.height = async () => {
// 	const data = await request({ url: host + endpoints.height + '?unconfirmed=1', json: true, timeout: 8000 });

// 	if (data.status != 'success')
// 		return Promise.reject();

// 	return data.data.nb;
// };

// exports.txs = async (address: string) => {
// 	const data = await request({ url: host + endpoints.txs + address + '?unconfirmed=1', json: true, timeout: 8000 });

// 	if (data.status != 'success')
// 		return Promise.reject();

// 	const txs = [];
// 	for (let i = 0; i < data.data.txs.length; i++) {
// 		const tx = data.data.txs[i];
// 		txs.push({ tx: tx.tx, value: Math.abs(tx.amount), confirmations: tx.confirmations, time: tx.time_utc, in: (tx.amount > 0.0) });
// 	}

// 	return txs;
// };


// exports.txs2 = async (address: string) => {
// 	const data = await request({ url: host + endpoints.txs + address + '?unconfirmed=1', json: true, timeout: 8000 });
// 	if (data.status != 'success')
// 		return Promise.reject();

// 	const txs = [];
// 	for (let i = 0; i < data.data.txs.length; i++) {
// 		const tx = data.data.txs[i];
// 		txs.push(tx.tx);
// 	}
// 	return txs;
// };


// exports.tx = async (txid: string) => {
// 	const data = await request({ url: host + endpoints.tx + txid, json: true, timeout: 8000 });

// 	if (data.status != 'success')
// 		return Promise.reject();

// 	const tx = { txid: txid, confirmations: data.data.confirmations, time: data.data.time_utc, from: [], to: [] };

// 	data.data.vins.forEach(v => {
// 		tx.from.push(v.address);
// 	});
// 	data.data.vouts.forEach(v => {
// 		tx.to.push(v.address);
// 	});

// 	return tx;
// };


// exports.balance = async (address: string) => {
// 	const data = await request({ url: `${host}${endpoints.address}${address}?confirmations=${conf.blockchain.limits.min.conf}`, json: true, timeout: 8000 });

// 	if (data.status != 'success')
// 		return Promise.reject();


// 	const data2 = await request({ url: host + endpoints.address + address + '?confirmations=0', json: true, timeout: 8000 });

// 	if (data2.data.balance < data.data.balance)
// 		return {
// 			balance: data2.data.balance,
// 			unconfirmed: 0,
// 			received: data.data.totalreceived
// 		};
// 	else
// 		return {
// 			balance: data.data.balance,
// 			unconfirmed: data2.data.balance - data.data.balance,
// 			received: data.data.totalreceived
// 		};
// };



// exports.unspent = async (address: string) => {
// 	// '?unconfirmed=1'
// 	const data = await request({ url: host + endpoints.unspent + address + param, json: true, timeout: 8000 });
// 	if (data.status != 'success')
// 		return Promise.reject();

// 	// return data.data.unspent; ??? value
// };


// exports.push = async (tx: string) => {
// 	const data = await request({ method: 'POST', url: host + endpoints.push, body: { 'hex': String(tx) }, json: true, timeout: 15000 });
// 	if (data.status != 'success')
// 		return Promise.reject();

// 	return data.data;
// };

// export {};
