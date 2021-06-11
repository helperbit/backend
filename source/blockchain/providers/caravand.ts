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

// exports.name = 'Caravand';

// const host = 'http://localhost:8086';
// const endpoints = {
// 	address: "/address/",
// 	tx: "/tx/"
// };


// exports.isNetworkSupported = (): boolean => {
// 	return true;
// };


// exports.height = async () => {
// 	const data = await request({ url: host, json: true, timeout: 8000 });

// 	if (data.status != 'ok')
// 		return Promise.reject();

// 	return data.state.height;
// };

// exports.txs = async (address: string) => {
// 	const data = await request({ url: host + endpoints.address + address + '/txs/expanded', json: true, timeout: 8000 });

// 	if (data.status != 'ok')
// 		return Promise.reject();

// 	const txs = [];
// 	data.txs.forEach(tx => {
// 		let incoming = true;
// 		let value = 0;

// 		tx.inputs.forEach(inp => {
// 			if (inp.address == address) {
// 				incoming = false;
// 				value += parseFloat(inp.value) / SAT_IN_BITCOIN;
// 			}
// 		});
// 		tx.outputs.forEach(out => {
// 			if (out.address == address && !incoming) {
// 				value -= parseFloat(out.value) / SAT_IN_BITCOIN;
// 			}
// 			if (out.address == address && !incoming) {
// 				value += parseFloat(out.value) / SAT_IN_BITCOIN;
// 			}
// 		});
// 		txs.push({ tx: tx.txid, confirmations: tx.confirmations, time: tx.time, value: value, in: incoming });
// 	});

// 	return txs;
// };

// exports.txs2 = async (address: string) => {
// 	const data = await request({ url: host + endpoints.address + address + '/txs', json: true, timeout: 8000 });

// 	if (data.status != 'ok')
// 		return Promise.reject();

// 	return data.txs;
// };

// exports.tx = async (txid: string) => {
// 	const data = await request({ url: host + endpoints.tx + txid, json: true, timeout: 8000 });
// 	if (data.status != 'ok')
// 		return Promise.reject();

// 	const tx = { txid: txid, confirmations: data.tx.confirmations, time: data.tx.time, from: [], to: [] };

// 	data.tx.inputs.forEach(v => {
// 		tx.from.push(v.address);
// 	});
// 	data.tx.outputs.forEach(v => {
// 		tx.to.push(v.address);
// 	});

// 	return tx;
// };


// exports.txraw = async (txid: string) => {
// 	const data = await request({ url: host + endpoints.tx + txid + '/raw', json: true, timeout: 8000 });

// 	if (data.status != 'ok')
// 		return Promise.reject();

// 	return data.hex;
// };

// exports.unspent = async (address: string) => {
// 	const data = await request({ url: host + endpoints.address + address + '/utxo', json: true, timeout: 8000 });
// 	if (data.status != 'ok')
// 		return Promise.reject();

// 	const txs = data.utxo.map(utx => {
// 		return {
// 			tx: utx.tx,
// 			n: utx.n,
// 			value: parseFloat(utx.value) / SAT_IN_BITCOIN
// 		}
// 	});
// 	return txs;
// };

// exports.balance = async (address: string) => {
// 	const data = await request({ url: host + endpoints.address + address, json: true, timeout: 8000 });
// 	if (data.status != 'ok')
// 		return Promise.reject();

// 	return {
// 		balance: parseFloat(data.address.balance) / SAT_IN_BITCOIN,
// 		unconfirmed: parseFloat(data.address.unconfirmed_balance) / SAT_IN_BITCOIN,
// 		received: parseFloat(data.address.received) / SAT_IN_BITCOIN
// 	};
// };



// exports.push = async (tx: string) => {
// 	const data = await request({ method: 'POST', url: host + endpoints.tx, body: { hex: tx }, json: true, timeout: 15000 });

// 	if (data.status != 'ok')
// 		return Promise.reject();

// 	/* We don't trust letchain broadcast */
// 	return Promise.reject();
// };

// export {};
