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
import execSync = require('sync-exec');
import conf = require('../../../conf');

const env = conf['env'];
const regtest = conf.blockchain.network.bech32 == 'bcrt';

let mineInterval = null;

export const mongoHost = env == 'gitlab' ? '--host mongo' : '--host localhost';
export const bitcoinCli = env == 'gitlab' ? '/opt/bitcoin-0.19.1/bin/bitcoin-cli' : 'bitcoin-cli';
export const api = 'http://localhost:3000/api/v1/';

if (regtest) {
	const blocks = Number(execSync(`${bitcoinCli} -regtest  -rpcuser=test -rpcpassword=test getblockcount`).stdout);

	if(blocks < 100) {
		execSync(`${bitcoinCli} -regtest  -rpcuser=test -rpcpassword=test generatetoaddress 101 "mhqo9zJRm4gBYFmBD6kCVCfZL3JS5UqLmj"`);
		execSync(`${bitcoinCli} -regtest  -rpcuser=test -rpcpassword=test importprivkey "cUxccFVBdJRq6HnyxiFMd8Z15GLThXaNLcnPBgoXLEv9iX6wuV2b"`);
	}

	mineInterval = setInterval(function () {
		process.stdout.write('\x1b[33mM\x1b[0m');
		execSync(`${bitcoinCli} -regtest  -rpcuser=test -rpcpassword=test generatetoaddress 1 "mhqo9zJRm4gBYFmBD6kCVCfZL3JS5UqLmj"`);
	}, 5000);
}


frisby.globalSetup({
	request: { headers: {} },
	response: { headers: { 'content-type': 'application/json' } },
	timeout: 60000
});

export function remove (rtype, q) {
	const cmd = "mongo " + mongoHost + " helperbit --eval 'db." + rtype + ".remove(" + q + ")'";
	execSync(cmd);
}

export function clearMerchandise () {
	const cmd = "mongo " + mongoHost + " helperbit --eval 'db.adminmerchandises.update({}, " + JSON.stringify({
		$set: {
			assigned: 0,
			assignments: []
		}
	}) + "," + JSON.stringify({ multi: true }) + ")'";
	execSync(cmd);
}

export function clean(base) {
	if (!base)
		base = 'frisbytest';

	remove('users', '{username: /.*' + base + '.*/}');
	remove('users', '{email: /.*' + base + '.*/}');
	remove('projects', '{owner: /.*' + base + '.*/}');
	remove('wallets', '{owner: /.*' + base + '.*/}');
	remove('proposednpos', '{reporter: /.*' + base + '.*/}');
	remove('proposednpos', '{name: /.*' + base + '.*/}');
	remove('alerts', '{user: /.*' + base + '.*/}');
	remove('transactions', '{from: /.*' + base + '.*/}');
	remove('rors', '{from: /.*' + base + '.*/}');
	remove('rors', '{to: /.*' + base + '.*/}');
	remove('campaigns', '{owner: /.*' + base + '.*/}');
	remove('donations', '{to.user: /.*' + base + '.*/}');
	remove('notifications', '{to.user: /.*' + base + '.*/}');
	remove('lightninginvoices', '{metadata.type: /.*' + base + '.*/}');
	remove('timelocktransactions', '{from: /.*' + base + '.*/}');
	clearMerchandise();
}


export function cleanResources(base) {
	return (data, next) => {
		// if (mineInterval)
		// 	clearInterval(mineInterval);

		clean(base);
		return next(data)
	};
}
