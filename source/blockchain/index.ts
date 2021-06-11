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

import * as bitcoinjs from 'bitcoinjs-lib';
import conf = require('../conf');
import log = require('../log');
import { RedisCache } from '../helpers/cache';
import Explorer from './providers/explorer';
import BlockstreamExplorer from './providers/blockstream';
// import HBExplorer from './providers/hbexplorer';
import { Async } from '../helpers/async';
import SmartbitExplorer from './providers/smartbit';
// import ChainsoExplorer from './providers/chainso';
import BlockchainInfoExplorer from './providers/blockchaininfo';
import BitpayExplorer from './providers/bitpay';
import Blockexplorer from './providers/blockexplorer';
import Localbitcoinschain from './providers/localbitcoinchain';
import { Output } from 'bitcoinjs-lib/types/transaction';
import * as metaF from './meta';
import { requestTyped } from '../helpers/request-typed';
import RegnetExplorer from './providers/regnetexplorer';
import { Conversion } from '../helpers/bitcoin';

const _cache = new RedisCache();

export namespace Blockchain {
	export interface Tx { txid: string; confirmations: number; time: number; from: string[]; to: string[] }
	export interface TxsInner { tx: string; value: number; time: number; confirmations: number; in: boolean }
	export type Txs = TxsInner[];
	export interface TxNative { txid: string; outputs: { address: string; value: number }[]; locktime: number }
	export interface Balance { balance: number; unconfirmed: number; received: number }
	export interface BalanceEx extends Balance { address: string }
	export interface Fee { fastestFee: number; hourFee: number; halfHourFee: number; slowestFee?: number }
	export interface Prices { usd?: number; btc: number; eur?: number; cny?: number; cad?: number; jpy?: number; rub?: number; gbp?: number }
	export interface UTXO { tx: string; n: number; value: number }

	export const meta = metaF;

	export class ExplorerRepository extends Explorer {
		private static _instance: ExplorerRepository;
		private explorers: Explorer[];
		private cache: RedisCache;

		static instance(): ExplorerRepository {
			if (ExplorerRepository._instance)
				return ExplorerRepository._instance;

			ExplorerRepository._instance = new ExplorerRepository(conf.blockchain.testnet);
			return ExplorerRepository._instance;
		}

		constructor(testnet: boolean) {
			super(testnet);
			this.cache = new RedisCache();

			if (testnet && conf.blockchain.network.bech32 != 'bcrt') {
				this.explorers = [
					new SmartbitExplorer(testnet),
					new BlockstreamExplorer(testnet),
					// new ChainsoExplorer(testnet), Using cloudflare
					new BitpayExplorer(testnet),
					// new Blockexplorer(testnet), Not availbe on testnet anymore
					new BlockchainInfoExplorer(testnet)
				];
			} else if (testnet && conf.blockchain.network.bech32 == 'bcrt') {
				this.explorers = [
					new RegnetExplorer(testnet)
				];
			} else {
				this.explorers = [
					// new HBExplorer(testnet),
					new BlockchainInfoExplorer(testnet),
					new BlockstreamExplorer(testnet),
					// new ChainsoExplorer(testnet), Using cloudflare
					new BitpayExplorer(testnet),
					new Blockexplorer(testnet),
					new Localbitcoinschain(testnet),
					new SmartbitExplorer(testnet),
				];
			}
		}

		private async iterateOver<T>(f: (ex: Explorer) => Promise<T>, cacheKey: string | null = null, cacheExpire: number = 0): Promise<T> {
			let res: T = null;

			if (cacheKey != null && conf.blockchain.network.bech32 != 'bcrt') {
				try {
					const pvalue = await this.cache.getJSON(cacheKey);
					if (pvalue == null)
						throw new Error('Invalid cache');
					log.debug('blockchain', `Got cached data`);
					return pvalue;
				} catch { }
			}


			for (let i = 0; i < this.explorers.length && res == null; i++) {
				try {
					res = await f(this.explorers[i]);
					if (res == null)
						throw new Error('Invalid data');
					// console.log(res);
					log.debug('blockchain', `Got data from ${this.explorers[i].name}`);
				} catch (err) {
					// console.log(err);
					log.debuggrey('blockchain', `No data from ${this.explorers[i].name}`);
				}
			}

			if (res == null)
				return Promise.reject();

			if (cacheKey != null) {
				if (cacheExpire != 0)
					await this.cache.set(cacheKey, JSON.stringify(res), cacheExpire);
				else
					await this.cache.set(cacheKey, JSON.stringify(res));
			}

			return res;
		}

		get name() { return 'ExplorerRepository' };

		isNetworkSupported(): boolean { return true; }

		invalidateAddressCache(address: string) {
			this.cache.expire('txs_' + address, 1);
			this.cache.expire('balance_' + address, 1);
			this.cache.expire('unspent_' + address, 1);
		}

		getHeight(): Promise<number> {
			log.debug('blockchain', 'Get height');
			return this.iterateOver<number>(e => e.getHeight());
		}

		async getHeightCached(): Promise<number> {
			try {
				return JSON.parse(await this.cache.get('blockchain_height'));
			} catch (err) {
				return await this.getHeight();
			}
		}

		getTransactions(address: string): Promise<Txs> {
			log.debug('blockchain', `Get transactions ${address}`);
			return this.iterateOver<Txs>(ex => ex.getTransactions(address), 'txs_' + address, 180);
		}

		getTransactions2(address: string): Promise<Txs> {
			log.debug('blockchain', `Get transactions2 ${address}`);
			return this.iterateOver<Txs>(ex => ex.getTransactions2(address), 'txs2_' + address, 180);
		}

		getTransaction(txid: string): Promise<Tx> {
			log.debug('blockchain', `Get transaction ${txid}`);
			return this.iterateOver<Tx>(ex => ex.getTransaction(txid), 'tx_' + txid, 180);
		}

		getTransactionRaw(txid: string): Promise<string> {
			log.debug('blockchain', `Get transaction raw ${txid}`);
			return this.iterateOver<string>(ex => ex.getTransactionRaw(txid), 'txraw_' + txid, 180);
		}

		getUnspent(address: string): Promise<UTXO[]> {
			log.debug('blockchain', 'Get unspent');
			return this.iterateOver<UTXO[]>(ex => ex.getUnspent(address), 'unspent_' + address, 30);
		}

		getBalance(address: string): Promise<Balance> {
			log.debug('blockchain', 'Get balance');
			return this.iterateOver<Balance>(ex => ex.getBalance(address), 'balance_' + address, 30);
		}

		async getMultiBalance(addresses: string[]): Promise<BalanceEx[]> {
			log.debug('blockchain', 'Get multibalance');
			const balances: BalanceEx[] = await this.iterateOver<BalanceEx[]>(ex => ex.getMultiBalance(addresses));
			await Async.forEach(balances, async (bal: BalanceEx) => {
				await this.cache.set('balance_' + bal.address, JSON.stringify(bal), 30);
			});

			return balances;
		}

		pushTransaction(txhex: string): Promise<string> {
			log.debug('blockchain', 'Push transaction');
			return this.iterateOver<string>(ex => ex.pushTransaction(txhex));
		}

		async pushTransactionAll(txhex: string): Promise<string> {
			log.debug('blockchain', 'Push transaction all');
			const txids = [];

			for (let i = 0; i < this.explorers.length; i++) {
				try {
					const txid = await this.explorers[i].pushTransaction(txhex);
					if (txid != null)
						txids.push(txid);
				} catch (err) {
					log.debuggrey('blockchain', `No data from ${this.explorers[i].name}: push`);
				}
			}

			if (txids.length > 0) {
				log.debug('blockchain', `Broadcasted ${txids[0]} to ${txids.length} explorers`);
				return txids[0];
			} else {
				const txid = bitcoinjs.Transaction.fromHex(txhex).getId();
				try {
					await this.getTransaction(txid);
					log.debug('blockchain', `Broadcasted ${txid} to 1 explorers`);
					return txid;
				} catch (err) {
					log.critical('blockchain', `Broadcast failed: ${txhex}`);
					return Promise.reject();
				}
			}
		}
	}

	export function invalidateAddressCache(address: string) {
		return ExplorerRepository.instance().invalidateAddressCache(address);
	}


	/* @Deprecated */
	/* Restituisce le transaction di un address con relativo balance e numero di conferme */
	export function getTransactions(address: string): Promise<Txs> {
		return ExplorerRepository.instance().getTransactions(address);
	}


	/* Restituisce la lista delle tx (in e out interessate da un address) */
	export function getTransactions2(address: string): Promise<Txs> {
		return ExplorerRepository.instance().getTransactions2(address);
	}

	/* Restituisce le informazioni riguardanti una transazione o null se non esiste */
	export function getTransaction(txid: string): Promise<Tx> {
		return ExplorerRepository.instance().getTransaction(txid);
	}


	/* Restituisce una tx non parsata */
	export function getTransactionRaw(txid: string): Promise<string> {
		return ExplorerRepository.instance().getTransactionRaw(txid);
	}

	/* Restituisce una tx parsata da bitcoinjs */
	export async function getTransactionNative(txid: string): Promise<TxNative> {
		try {
			const traw = await getTransactionRaw(txid);
			const tx = bitcoinjs.Transaction.fromHex(traw);
			const res = {
				txid: tx.getId(),
				locktime: tx.locktime,
				outputs: []
			};

			tx.outs.forEach((o: Output) => {
				try {
					res.outputs.push({
						address: bitcoinjs.address.fromOutputScript(o.script, conf.blockchain.network),
						value: Conversion.toBitcoin(o.value)
					});
				} catch (err) { /* Handle OP_RETURN or other unspendable */ }
			});

			return res;
		} catch (e) {
			return Promise.reject(e);
		}
	}


	/* Restituisce il balance di un indirizzo */
	export function getBalance(address: string): Promise<Balance> {
		return ExplorerRepository.instance().getBalance(address);
	}


	/* Restituisce il balance di un gruppo di indirizzi */
	export async function getMultiBalance(addresses: string[]): Promise<BalanceEx[]> {
		const flatten = (arr: BalanceEx[]): BalanceEx[] => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
		const res = [];

		try {
			for (let i = 0; i < addresses.length; i += 100) {
				const addrgroup = addresses.slice(i, i + 100);
				res.push(await ExplorerRepository.instance().getMultiBalance(addrgroup));
			}
			return flatten(res);
		} catch (err) {
			return Promise.reject();
		}
	}


	/* Restituisce una lista di transazioni non spese da un indirizzo */
	export function getUnspent(address: string): Promise<UTXO[]> {
		return ExplorerRepository.instance().getUnspent(address);
	}


	/* Invia una transazione nella rete */
	export async function pushTransaction(txhex: string): Promise<string> {
		return await ExplorerRepository.instance().pushTransaction(txhex);
	}


	/* Invia una transazione nella rete usando tutti gli explorer disponibili */
	export async function pushTransactionAll(txhex: string): Promise<string> {
		return await ExplorerRepository.instance().pushTransactionAll(txhex);
	}

	/* Return the current blockchain height */
	export async function getHeight(): Promise<number> {
		return ExplorerRepository.instance().getHeight();
	}

	export async function getHeightCached(): Promise<number> {
		return ExplorerRepository.instance().getHeightCached();
	}


	/* Restituisce le fee * byte */
	export async function getFees(retry: number = 0): Promise<Fee> {
		try {
			const data: Fee = JSON.parse(await _cache.get('blockchain_fees'));
			for (const x in data) {
				data[x] = Number(data[x]);
			}

			return data;
		} catch (err) {
			if (retry < 5) {
				await updateFees();
				return (await getFees(retry + 1));
			} else {
				log.critical('blockchain', 'Failed to retrieve fees: ' + err);
				return Promise.reject(err);
			}
		}
	}

	/* Restituisce il cambio corrente */
	export async function getPrices(): Promise<Prices> {
		try {
			return JSON.parse(await _cache.get('blockchain_prices'));
		} catch (err) {
			log.critical('blockchain', 'Failed to retrieve prices: ' + err);
			return Promise.reject(err);
		}
	}


	/* Converte da value/currency a newcurrency */
	export async function convertCurrency(value: number, currency: string, newcurrency: string, price?: Prices) {
		if (currency == newcurrency)
			return value;

		if (!price)
			price = await getPrices();

		if (currency.toLocaleLowerCase() != 'btc') {
			value = value / price[currency.toLowerCase()];
		}

		return value * price[newcurrency.toLowerCase()];
	}


	export async function updateFees() {
		try {
			const data2 = await requestTyped<{
				[key: number]: number;
			}>({ url: 'https://blockstream.info/api/fee-estimates' });
			const data: Fee = {
				fastestFee: Number(data2['2']),
				halfHourFee: Number(data2['4']),
				hourFee: Number(data2['6'])
			};

			if (!data.fastestFee || !data.halfHourFee || !data.hourFee)
				return;

			await _cache.set('blockchain_fees', JSON.stringify(data));
		} catch (err) { }
	}

	export async function updatePrices() {
		try {
			let trt = null;
			try {
				trt = await requestTyped<{
					last: number;
				}>({ url: 'https://api.therocktrading.com/v1/funds/BTCEUR/ticker' });
			} catch (err) { }

			const data = await requestTyped<{
				currencies: {
					[currency: string]: {
						price: number;
					};
				};
			}>({ url: 'https://ethereumwisdom.com/data/bitcoinwisdom.json', json: true });
			const prices: Prices = { btc: 1.0 };

			if (trt)
				prices.eur = trt.last;
			else
				prices.eur = data.currencies.EUR.price;

			const css = ['USD', 'CNY', 'GBP', 'JPY', 'RUB', 'CAD'];
			for (const c in css) {
				if (css[c] in data.currencies)
					prices[css[c].toLowerCase()] = data.currencies[css[c]].price;
			}

			await _cache.set('blockchain_prices', JSON.stringify(prices));
		} catch (err) { }
	}


	/* Call handlers on every new block */
	export function onBlock(timeout: number, handlers: (() => void)[]) {
		const blockCheck = async (force) => {
			try {
				const hh = await getHeight();
				let value = await _cache.get('blockchain_height', true);
				
				if (value != null)
					value = parseInt(value);

				force = conf.blockchain.network.bech32 == 'bcrt';
				
				if ((typeof (value) == 'number' && value < hh) || typeof (value) != 'number' || force) {
					log.debug('blockchain', `New block detected ${hh}`);
					handlers.forEach(h => { h(); });
					await _cache.set('blockchain_height', hh);
				} else {
					log.debug('blockchain', `Current block height is: ${hh}`);
				}
			} catch (err) { }
		};

		setInterval(blockCheck, timeout);
		blockCheck(true);
	}
}
