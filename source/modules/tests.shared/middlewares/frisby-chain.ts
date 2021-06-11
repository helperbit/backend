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

import frisby = require('frisby');
import { cleanResources, api } from './common';
import execSync = require('sync-exec');
import conf = require('../../../conf');
import { TestRequest } from './test-request';

const env = conf['env'];
const regtest = conf.blockchain.network.bech32 == 'bcrt';
const bitcoinCli = env == 'gitlab' ? '/opt/bitcoin-0.19.1/bin/bitcoin-cli' : 'bitcoin-cli';

export type ChainFn = (data: any, next?: ChainFn) => void;

export function frisbyChain(baseData, callChain: ChainFn[]) {
	callChain.push(data => { });

	const nextPrepare = (data, i) => {
		if (i < callChain.length)
			return (data, next) => {
				return callChain[i](data, nextPrepare(data, i + 1));
			};
		else
			return (data) => {
				return callChain[i](data);
			};
	};

	return (nextPrepare(baseData, 0) as any)(baseData);
}


export class TestChain {
	chainList: ChainFn[] = [];
	data: any = {};
	enableBitcoin: boolean = false;

	constructor(private resourcePrefix = null, opts: { data?: any; enableBitcoin?: boolean } = null) {
		if (opts && 'data' in opts)
			this.data = opts.data;
		if (opts && 'enableBitcoin' in opts)
			this.enableBitcoin = opts.enableBitcoin;

		if (this.resourcePrefix)
			this.pushClean();
	}

	pushChain(chain: TestChain) {
		this.chainList = this.chainList.concat(chain.toChain())
	}

	pushClean() {
		this.chainList.push(cleanResources(this.resourcePrefix));
	}

	push(fn: ChainFn): TestChain {
		this.chainList.push(fn);
		return this;
	}

	pushReq(f: TestRequest): TestChain {
		this.chainList.push(f.toChainEntry());
		return this;
	}

	pushData(dataOver: any, preserve: boolean = false): TestChain {
		return this.push((data, next) => {
			if ('outerData' in data)
				dataOver = { ...dataOver, ...{ outerData: data.outerData } };
			if (typeof (dataOver) == 'function')
				next(dataOver(data));
			else if (preserve)
				next({ ...data, ...dataOver });
			else
				next(dataOver);
		});
	}

	toChain() {
		return [(outerData, next) => {
			const data = this.data;
			data.outerData = outerData;
			return next(data);
		}].concat(this.chainList).concat([(data, next) => {
			return next(data.outerData);
		}]);
	}

	exec() {
		let mineInterval = null;
		if (regtest && this.enableBitcoin) {
			execSync(`${bitcoinCli} -regtest  -rpcuser=test -rpcpassword=test generatetoaddress 101 "mhqo9zJRm4gBYFmBD6kCVCfZL3JS5UqLmj"`);
			execSync(`${bitcoinCli} -regtest  -rpcuser=test -rpcpassword=test importprivkey "cUxccFVBdJRq6HnyxiFMd8Z15GLThXaNLcnPBgoXLEv9iX6wuV2b"`);

			mineInterval = setInterval(function () {
				process.stdout.write('\x1b[33mM\x1b[0m');
				execSync(`${bitcoinCli} -regtest  -rpcuser=test -rpcpassword=test generatetoaddress 1 "mhqo9zJRm4gBYFmBD6kCVCfZL3JS5UqLmj"`);
			}, 5000);
		}

		if (this.resourcePrefix)
			this.pushClean();

		frisbyChain(this.data, this.chainList);

		if (this.enableBitcoin && mineInterval)
			clearInterval(mineInterval);
	}
}
