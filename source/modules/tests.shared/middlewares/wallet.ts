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
import bitcoinjs = require('bitcoinjs-lib');
import execSync = require('sync-exec');
import common = require('./common');
import conf = require('../../../conf');

const regtest = conf.blockchain.network.bech32 == 'bcrt';
export const FAUCET_AMOUNT = 0.005;
const mineInterval = null;

export function clearIntervals (data, next) {
	if (mineInterval)
		clearInterval(mineInterval);
	return next();
}


function importAddress(address) {
	if (regtest) {
		execSync(`${common.bitcoinCli}  -regtest -rpcuser=test -rpcpassword=test importaddress "${address}"`);
	}
}

// Bitcoin address              : mhqo9zJRm4gBYFmBD6kCVCfZL3JS5UqLmj
const key1 = {
	priv: 'cUxccFVBdJRq6HnyxiFMd8Z15GLThXaNLcnPBgoXLEv9iX6wuV2b',
	pub: '03c411cf39aca4395c81c35921dc832a0d1585d652ab1b52ccc619ff9fbbc57877'
};

// Bitcoin address              : mpSAvmKXAE8B6H6bgLnGBG8iyC6tQgEy9D
const key2 = {
	priv: 'cVSNe9ZdZRsRvEBL8YRR7YiZmH4cLsf5FthgERWkZezJVrGseaXy',
	pub: '020636d944458a4663b75a912c37dc1cd59b11f9a00106783a65ba230d929b96b0'
};

// Bitcoin address				: mq1HD5wiNLCNQv8u9wdwLvRH5JiMbxJHR4
const key3 = {
	priv: 'cQqbmgCQroize8cD1484C5243Q7twmHq5YjN3fYFayApcfoZykcF',
	pub: '02d1448cbf19528a1a27e5958ba73d930b5b3facdbe5c30c7094951a287fcc9149'
};


const multisigKeys = [key1, key2, key3];

export const keys = {
	key1: key1
};


export function signTx(txhex, privkey) {
	const txb = bitcoinjs.Psbt.fromHex(txhex, { network: bitcoinjs.networks.testnet });
	const upair = bitcoinjs.ECPair.fromWIF(privkey, bitcoinjs.networks.testnet);
	txb.signAllInputs(upair);
	return txb.toHex();
}


/* Wallet multisig creation */
export function createLegacyMultisig(data, next) {
	frisby.create('/wallet/multisig/create - create a multisig wallet EW10')
		.post(common.api + 'wallet/multisig/create',
			{ admins: data.admins, n: data.admins.length, label: 'Hello there! TH' }, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({ id: String })
		.afterJSON(json => {
			data.walletid = json.id;
			next(data);
		})
		.toss();
}

/* Wallet P2SHWSH multisig creation */
export function createMultisig(data, next) {
	frisby.create('/wallet/multisig/create - create a multisig wallet')
		.post(common.api + 'wallet/multisig/create',
			{ admins: data.admins, n: data.admins.length, label: 'Hello there! TH' }, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({ id: String })
		.afterJSON(json => {
			data.walletid = json.id;
			next(data);
		})
		.toss();
}

/* Wallet P2WSH multisig creation */
export function createMultisigP2WSH(data, next) {
	frisby.create('/wallet/multisig/create - create a multisig wallet P2WSH')
		.post(common.api + 'wallet/multisig/create',
			{ scripttype: 'p2wsh', admins: data.admins, n: data.admins.length, label: 'Hello there! TH' }, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({ id: String })
		.afterJSON(json => {
			data.walletid = json.id;
			next(data);
		})
		.toss();
}

/** Wallet multisig feed 
 * data should contain:
 * 	- adminob
 * 	- walletid
*/
export function feedMultisig(data, next) {
	const feedSingle = i => {
		if (i >= data.adminob.length)
			return next(data);

		if (data.adminob[i].skipsign) {
			console.log(`\nLogin into ${data.adminob[i].email} and feed the wallet manually.\n`);
			return feedSingle(i + 1);
		}

		const token = data.adminob[i].token;

		frisby.create('/me/notifications - feed the multisig wallet notify')
			.get(common.api + 'me/notifications')
			.addHeader('authorization', 'Bearer ' + data.adminob[i].token)
			.expectStatus(200)
			.afterJSON(json => {
				json.notifications.forEach(not => not.code == '6');

				frisby.create('/wallet/multisig/feed - feed the multisig wallet')
					.post(common.api + 'wallet/multisig/feed',
						{
							pubkey: multisigKeys[i].pub,
							wallet: data.walletid
						}, { json: true })
					.addHeader('authorization', 'Bearer ' + data.adminob[i].token)
					.expectStatus(200)
					.afterJSON(json => {
						frisby.create('/me/notifications - feed the multisig wallet notify')
							.get(common.api + 'me/notifications')
							.addHeader('authorization', 'Bearer ' + token)
							.expectStatus(200)
							.afterJSON(json => {
								json.notifications.forEach(function (not) {
									if (not.code == '6') {
										return false;
									}
								});
								feedSingle(i + 1);
							})
							.toss();
					})
					.toss();
			})
			.toss();
	};

	return feedSingle(0);
}


function signMultisigGeneric(withrefuse, n, data, scripttype, next) {
	const singleSign = i => {
		if (data.adminob[i].skipsign) {
			console.log(`\nLogin into ${data.adminob[i].email} and sign the transaction manually.\n`);
			return next(data);
		}

		frisby.create('/wallet/multisig/txs - get belonged multisig transactions')
			.get(common.api + 'wallet/multisig/txs')
			.addHeader('authorization', 'Bearer ' + data.adminob[i].token)
			.expectStatus(200)
			.waits(1000)
			.expectJSONTypes({ txs: Array })
			.expectJSONTypes('txs.*', {
				n: Number,
				admins: Array,
				scripttype: String,
				signers: Array,
				from: String,
				description: String,
				value: Number,
				fee: Number,
				to: String,
				hex: String,
				_id: String,
				pubkeys: Array,
				utxos: Array
			})
			.expectJSON({ txs: [{ from: data.username, n: data.admins.length, admins: data.admins }] })
			.afterJSON(json => {
				let test = null;

				/* Il primo user rifiuta sw withrefuse */
				if (i === 0 && withrefuse) {
					test = frisby.create('/wallet/multisig/:id/refuse - refuse to sign a multisig transaction')
						.post(common.api + 'wallet/multisig/' + json.txs[0]._id + '/refuse',
							{}, { json: true })
						.waits(1000)
						.addHeader('authorization', 'Bearer ' + data.adminob[i].token)
						.expectStatus(200);
				}
				/* Gli altri firmano */
				else {
					const signedHex = signTx(json.txs[0].hex, multisigKeys[i].priv);

					test = frisby.create('/wallet/multisig/:id/sign - sign a multisig transaction')
						.post(common.api + 'wallet/multisig/' + json.txs[0]._id + '/sign',
							{ txhex: signedHex }, { json: true })
						.waits(1000)
						.addHeader('authorization', 'Bearer ' + data.adminob[i].token)
						.expectStatus(200)
						.expectJSONTypes({ broadcast: Boolean });
				}

				/* Dopo passo al successivo */
				test = test.afterJSON(json => {
					if (i == n && withrefuse || i == (n - 1) && !withrefuse)
						data.txid = json.txid;

					i++;
					if (i < n)
						singleSign(i);
					else {
						next(data);
					}
				});

				test.toss();
			})
			.toss();
	};

	singleSign(0);
}

export function signMultisig(data, next) { return signMultisigGeneric(false, data.adminob.length, data, 'p2sh-p2wsh', next); }
export function signMultisigP2WSH(data, next) { return signMultisigGeneric(false, data.adminob.length, data, 'p2wsh', next); }
export function signMultisigLegacy(data, next) { return signMultisigGeneric(false, data.adminob.length, data, 'p2sh', next); }
export function signMultisigNotAll(data, next) { return signMultisigGeneric(false, data.adminob.length - 1, data, 'p2sh-p2wsh', next); }
export function signMultisigWithRefuse(data, next) { return signMultisigGeneric(true, data.adminob.length, data, 'p2sh-p2wsh', next); }




function signVerifyMultisigGeneric (n, data, scripttype, next) {
	const singleSign = i => {
		if (data.adminob[i].skipsign) {
			console.log(`\nLogin into ${data.adminob[i].email} and sign the verification manually.\n`);
			return next(data);
		}

		frisby.create('/wallet/verify/:id - get a tltx')
			.get(common.api + 'wallet/verify/' + data.tltx)
			.addHeader('authorization', 'Bearer ' + data.token)
			.expectStatus(200)
			.afterJSON(j => {
				data.tltx_data = j;
				let test = null;

				let signedHex = '';
				let recoveryHex = '';

				if (!data.tltx_data.onlycheck) {
					signedHex = signTx(data.tltx_data.hex, multisigKeys[i].priv);
					recoveryHex = signTx(data.tltx_data.recoveryhex, multisigKeys[i].priv);
				}

				test = frisby.create('/wallet/:address/verify/feed - feed a multisig verification')
					.post(common.api + 'wallet/' + data.address + '/verify/feed',
						{ txhex: signedHex, recoveryhex: recoveryHex }, { json: true })
					.waits(1000)
					.addHeader('authorization', 'Bearer ' + data.adminob[i].token)
					.expectStatus(200);

				/* Dopo passo al successivo */
				test = test.afterJSON(json => {
					i++;
					if (i < n) singleSign(i); else next(data);
				});

				test.toss();
			})
			.toss();
	};

	singleSign(0);
}

export function signVerifyMultisig(data, next) { return signVerifyMultisigGeneric(data.adminob.length, data, 'p2sh-p2wsh', next); }
export function signVerifyMultisigP2WSH(data, next) { return signVerifyMultisigGeneric(data.adminob.length, data, 'p2wsh', next); }
export function signVerifyMultisigLegacy(data, next) { return signVerifyMultisigGeneric(data.adminob.length, data, 'p2sh', next); }




export function waitTxConfirmation(data, next) {
	frisby.create('/transaction/:txid - get transaction')
		.get(common.api + 'transaction/' + data.txid)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON({ status: 'confirmed' })
		.retry(2000, 5000)
		.afterJSON(j => next(data))
		.toss();
}

export function waitDonationConfirmation(data, next) {
	frisby.create('/donation/:txid - get donation')
		.get(common.api + 'donation/' + data.txid)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON({ status: 'confirmed' })
		.retry(2000, 5000)
		.afterJSON(j => next(data))
		.toss();
}

export function waitDonationDetect(data, next) {
	frisby.create('/donation/:txid - get donation')
		.get(common.api + 'donation/' + data.txid)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON({ status: 'broadcasted' })
		.retry(2000, 5000)
		.afterJSON(j => next(data))
		.toss();
}

/* Wallet creation */
export function createLegacy(data, next) {
	frisby.create('/wallet/create - create wallet')
		.post(common.api + 'wallet/create', {
			pubkeys: [key1.pub, key2.pub],
			scripttype: 'p2sh'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({
			pubkeysrv: String,
			address: String
		}).afterJSON(json => {
			importAddress(json.address);
			data.address = json.address;
			data.privkey = key1.priv;
			next(data);
		})
		.toss();
}

export function createP2SHP2WSH(data, next) {
	frisby.create('/wallet/create - create wallet p2sh-p2wsh')
		.post(common.api + 'wallet/create', {
			pubkeys: [key1.pub, key2.pub]
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({
			pubkeysrv: String,
			address: String
		}).afterJSON(json => {
			importAddress(json.address);
			data.address = json.address;
			data.privkey = key1.priv;
			next(data);
		})
		.toss();
}

export function createP2WSH(data, next) {
	frisby.create('/wallet/create - create wallet p2sh-p2wsh')
		.post(common.api + 'wallet/create', {
			pubkeys: [key1.pub, key2.pub],
			scripttype: 'p2wsh'
		}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({
			pubkeysrv: String,
			address: String
		}).afterJSON(json => {
			importAddress(json.address);
			data.address = json.address;
			data.privkey = key1.priv;
			next(data);
		})
		.toss();
}


/* Wallet faucet */
export function faucetHelperbit(data, next) {
	frisby.create('/wallet/:address/faucet - get faucet and wait for balance')
		.get(common.api + 'wallet/' + data.address + '/faucet')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.retry(5, 5000)
		.afterJSON(json => {
			frisby.create('/wallet/:address/balance')
				.get(common.api + 'wallet/' + data.address + '/balance')
				.addHeader('authorization', 'Bearer ' + data.token)
				.expectStatus(200)
				.expectJSON({ balance: function (e) { return e >= FAUCET_AMOUNT } }) // this was unconfirmed
				.waits(5000)
				.retry(500, 5000)
				.afterJSON(j => next(data))
				.toss();
		})
		.toss();
}


export function sendToAddress (address, amount) {
	importAddress(address);
	const cmd = `${common.bitcoinCli} ${regtest ? '-regtest' : '-testnet'}  -rpcuser=test -rpcpassword=test sendtoaddress "${address}" ${amount}`;
	return execSync(cmd).stdout.replace('\n', '');
}

export function sendToMany (destList) {
	for (const a in destList) {
		importAddress(a);
	}

	const cmd = `${common.bitcoinCli} ${regtest ? '-regtest' : '-testnet'}  -rpcuser=test -rpcpassword=test sendmany "" "${JSON.stringify(destList).replace(/"/g, '\\"')}"`;
	return execSync(cmd).stdout.replace('\n', '');
}

/* Receive faucet from running bitcoin-core */
export function faucetCore(data, next) {
	const txid = sendToAddress(data.address, FAUCET_AMOUNT);

	frisby.create('/wallet/:address/balance')
		.get(common.api + 'wallet/' + data.address + '/balance')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSON({ balance: function (e) { return e >= FAUCET_AMOUNT; } }) // this was unconfirmed
		.retry(500, 5000)
		.afterJSON(j => {
			data.unconfirmed = j.unconfirmed;
			data.balance = j.balance;
			next(data);
		})
		.toss();
}


export function faucet(data, next) { return faucetCore(data, next); }

/* Wallet balance */
export function balance(data, next) {
	importAddress(data.address);

	frisby.create('/wallet/:address/balance')
		.get(common.api + 'wallet/' + data.address + '/balance')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({
			unconfirmed: Number,
			balance: Number
		})
		.afterJSON(json => {
			data.unconfirmed = json.unconfirmed;
			data.balance = json.balance;
			next(data);
		})
		.toss();
}


/* Return wallet */
export function getWallet(data, next) {
	frisby.create('/wallet/:address')
		.get(common.api + 'wallet/' + data.address)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(json => {
			data.wallet = json;
			next(data);
		})
		.toss();
}

/* Return wallet */
export function getMultisig(data, next) {
	frisby.create('/wallet/')
		.get(common.api + 'wallet/')
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.afterJSON(json => {
			data.wallet = json.wallets[0];
			data.address = json.wallets[0].address;
			importAddress(data.address);
			next(data);
		})
		.toss();
}

/* Wallet withdraw fee */
export function withdrawFee(data, next) {
	let destination = "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ";
	if (data.destinationaddress)
		destination = data.destinationaddress;

	let value = data.wvalue || data.balance || data.unconfirmed;
	if ('donation' in data) {
		value = data.donation.amount;
		destination = data.donation.address
	}

	frisby.create('/wallet/:address/withdraw/fees - request withdraw fees')
		.post(common.api + 'wallet/' + data.address + '/withdraw/fees',
			{
				"value": value,
				"destination": destination,
			}, { json: true })
		.expectStatus(200)
		.waits(15000)
		.retry(10, 15000)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSONTypes({
			fees: Number
		})
		.afterJSON(json => {
			data.fees = json.fees / 100000000;
			next(data);
		})
		.toss();
}


/* Withdraw multisig */
export function withdrawMultisig(data, next) {
	frisby.create('/wallet/:address/withdraw - request a withdraw')
		.post(common.api + 'wallet/' + data.address + '/withdraw',
			{
				"value": (data.balance + data.unconfirmed) - data.fees,
				"destination": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
				"fee": data.fees,
				"description": "Invio fondi per pagare il frontendista"
			}, { json: true })
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectStatus(200)
		.expectJSONTypes({
			txhex: String,
			utxos: Array
		})
		.expectJSONTypes('utxos.*', {
			tx: String,
			n: Number,
			value: Number
		})
		.afterJSON(j => next(data))
		.toss();
}



/* Wallet withdraw to source */
export function withdraw(data, next) {
	let destination = "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ";
	if (data.destinationaddress)
		destination = data.destinationaddress;

	let value = data.balance + data.unconfirmed - data.fees;
	let donation = null;
	if ('donation' in data) {
		value = data.donation.amount;
		destination = data.donation.address;
		donation = data.donation.donation;
	}

	frisby.create('/wallet/:address/withdraw - request a withdraw p2sh-p2wsh')
		.post(common.api + 'wallet/' + data.address + '/withdraw',
			{
				"value": value,
				"destination": destination,
				"fee": data.fees,
				"donation": donation
			}, { json: true })
		.expectStatus(200)
		.addHeader('authorization', 'Bearer ' + data.token)
		.expectJSONTypes({
			txhex: String,
			utxos: Array
		})
		.expectJSONTypes('utxos.*', {
			tx: String,
			n: Number,
			value: Number
		})
		.afterJSON(json => {
			const signedhex = signTx(json.txhex, key1.priv);
			const senddata = { "txhex": signedhex };
			if ('donation' in data)
				senddata['donation'] = data.donation.donation;

			frisby.create('/wallet/:address/send - send p2sh-p2wsh withdraw transaction')
				.post(common.api + 'wallet/' + data.address + '/send', senddata, { json: true })
				.expectStatus(200)
				.addHeader('authorization', 'Bearer ' + data.token)
				.waits(5000)
				.retry(10, 15000)
				.afterJSON(json => {
					data.txid = json.txid;
					next(data);
				})
				.toss();
		})
		.toss();
}
