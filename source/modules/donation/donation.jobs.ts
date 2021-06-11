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

import moment = require('moment');
import log = require('../../log');
import conf = require('../../conf');
import { Blockchain } from "../../blockchain";
import donationController = require('./donation.controller');
import telegramHelper = require('../../helpers/telegram');
import { $DonationDocument, Donation, DonationModel } from './donation.model';
import { $FiatDonationDocument, FiatDonation, FiatDonationModel } from '../../modules/donation.fiat/fiatdonation.model';
import { UserTypes, User } from '../../modules/user/user.model';
import { Wallet } from '../wallet/wallet.model';
import { Project } from '../project/project.model';
import { Event } from '../event/event.model';
import { Async } from '../../helpers/async';

/* Check if a tx is from a know helperbit address */
async function guessTxFrom(txid: string): Promise<{ address: string; from?: string; country?: string }> {
	try {
		const tx = await Blockchain.getTransaction(txid);
		const wallet = await Wallet.findOne({ address: { $in: tx.from } }, 'owner address').exec();

		if (wallet === null) 
			return { address: tx.from[0], from: null, country: null };

		const u = await User.findOne({ username: wallet.owner }, 'country username').exec();
		return { address: wallet.address, from: u.username, country: u.country };
	} catch (err) {
		return Promise.reject(err);
	}
}

/* Check if a tx is to a list of know helperbit addresses */
async function guessTxTo(txid: string): Promise<{ user?: string; type?: UserTypes; address: string; country?: string; value: number }[]> {
	let txnat: any = null;

	try {
		txnat = await Blockchain.getTransactionNative(txid);
	} catch (err) {
		return Promise.reject(err);
	}
	const pouts = [];

	txnat.outputs.forEach(out => {
		pouts.push(new Promise(async (resolve, reject) => {
			const wallet = await Wallet.findOne({ address: out.address }, 'owner').exec();
			if (wallet == null)
				return resolve({ user: null, type: null, country: null, address: out.address, value: out.value });

			const user = await User.findOne({ username: wallet.owner }, 'username usertype').exec();
			if (user == null)
				return resolve({ user: null, type: null, country: null, address: out.address, value: out.value });

			return resolve({ user: user.username, country: user.country, type: user.usertype, address: out.address, value: out.value });
		}));
	});

	try {
		const results = await Promise.all(pouts);
		return (results.filter(r => { return r.user != null; }));
	} catch (err) {
		return Promise.reject(err);
	}
}


/* Fixa le donazioni dove il tocountry ed il from country non sono settate */
export async function countriesFix() {
	const donations = await Donation.find({
		$or: [
			{ tocountries: [] },
			{ tocountry: null },
			{ tocountry: "" },
			{ fromcountry: null },
			{ fromcountry: "" }
		]
	}).exec();

	await Async.forEach(donations, async donation => {
		const promises = [];
		let to = false;
		let from = false;

		if (donation.tocountries.length == 0 || donation.tocountry == '' || donation.tocountry == null) {
			to = true;
			promises.push(User.find({ $and: [{ country: { $ne: '' } }, { country: { $ne: null } }], username: { $in: donation.to.map(to => { return to.user; }) } }, 'country').exec());
		}

		if ((donation.fromcountry == null || donation.fromcountry == '') && donation.from != null) {
			from = true;
			promises.push(User.find({ $and: [{ country: { $ne: '' } }, { country: { $ne: null } }], username: donation.from }, 'country').exec());
		}

		if (promises.length > 0) {
			const results = await Promise.all(promises);
			let modified = false;
			let i = 0;

			if (to && results.length > 0 && results[i].length > 0) {
				donation.tocountries = results[i].map(r => { return r.country; });
				donation.tocountry = donation.tocountries[i];
				modified = true;
				i += 1;
			}

			if (from && results.length > i && results[i].length == 1) {
				donation.fromcountry = results[i][0].country;
				modified = true;
			}

			if (modified) {
				donation.save(err => {
					log.job.debug('donation', `Updated ${donation.txid} with new countries`);
				});
			}
		}
	});
};


/* Chiamata periodicamente, controlla le transazioni pendenti (non confermate);
 * se il numero di conferme supera quello minimo -> pending = true,
 * se la transazione non esiste viene eliminata */
export async function confirmationCheck() {
	const donations: $DonationDocument[] = await Donation.find({ status: 'broadcasted' }).select('+gift').exec();

	if (donations == null)
		return log.job.error('donation', `Can't get broadcasted donations from db`);

	log.job.debug('donation', `Checking ${donations.length} unconfirmed transactions`);

	await Async.forEach(donations, async (d: $DonationDocument) => {
		if (!d || !d.txid || d.txid.indexOf('.') != -1) return;

		try {
			const tx = await Blockchain.getTransaction(d.txid);

			if (tx.confirmations >= conf.blockchain.limits.min.donationconf) {
				// if ((await Donation.findOne({txid: d.txid})).exec().status == 'confirmed')
				//	return;

				d.status = 'confirmed';

				const fd: $FiatDonationDocument = await FiatDonation.findOne({ txid: d.txid }).exec();
				if (fd != null) {
					d.fiatdonation = fd._id;

					/* Set the donation.from if the fiatdonation is from a logged user */
					if (fd.username) {
						d.from = fd.username;
					}

					if (fd.campaign) {
						d.campaign = fd.campaign;
					}

					if (fd.gift.enabled) {
						d.gift.message = fd.gift.message;
						d.gift.email = fd.gift.email;
						d.gift.name = fd.gift.name;
						d.gift.enabled = true;
						d.markModified('gift');
					}
				}

				// d.fromaddress = tx.from [0];
				try {
					const frominfo = await guessTxFrom(d.txid);
					if (!d.from && frominfo.from) {
						d.from = frominfo.from;
					}

					d.fromcountry = frominfo.country;
					d.fromaddress = frominfo.address;

					await d.save();
				} catch (err) {
					d.fromaddress = tx.from[0];

					await d.save();
				}


				const tos = d.to.map((to) => { return ` - ${to.address} (${to.user || ''}): ${to.value} BTC\n`; }).reduce((a, b) => { return a + b; });
				telegramHelper.notify(`${d.txid} - New donation confirmed from ${d.from || 'anonymous'} to: ${tos} of value ${d.value} BTC`);

				log.job.debug('donation', `Confirmed donation: ${d.txid}`);

				/* Update stats */
				await donationController.confirm(d);
				await updateReceived();
			} else if (tx === null && false /* DATE check */) {
				// Donation.remove({ _id: d._id }, (err) => { });
			}
		} catch (err) { }
	});
};


/* Periodic check of incoming donation where the donation is not present */
export async function unhandledTransactionCheck() {
	const handleTx = async (owner, w, tx) => {
		/* Check if the value is associated to a regular donation in waiting status */
		const ds: $DonationDocument[] = await Donation.find({ $or: [{ txid: tx.tx }, { $and: [{ value: tx.value }, { status: 'waiting' }, { 'to.user': w.owner }] }] }).exec();
		if (ds.length !== 0) return;

		const d: $DonationDocument = new Donation();
		d.txid = tx.tx;
		d.status = 'broadcasted';
		d.expiry = null;
		d.time = new Date();

		const fd = await FiatDonationModel.getByTxID(tx.tx);
		if (fd != null) {
			d.fiatdonation = fd._id;

			/* Set the donation.from if the fiatdonation is from a logged user */
			if (fd.username) {
				d.from = fd.username;
			}

			if (fd.campaign) {
				d.campaign = fd.campaign;
			}
		}

		let tolist = [];
		try {
			tolist = await guessTxTo(tx.tx);
		} catch (err) {
			return log.job.error('donation', `Unhandled donation ${d.txid}, failed to get guessto results`);
		}

		d.tocountries = [];
		d.tocountry = null;

		d.to = tolist.map(to => {
			if (to.country != null) {
				d.tocountries.push(to.country);
				d.tocountry = to.country;
			}
			return {
				user: to.user,
				type: to.type,
				address: to.address,
				value: to.value
			};
		});

		try {
			const frominfo = await guessTxFrom(tx.tx);

			if (frominfo.from == owner.username) {
				// log.job.debug ('donation', `Unhandled donation ${d.txid} is not considered as donation because is from the same user ${owner.username}`);
				return;
			}

			d.to = d.to.filter(to => { return to.address !== frominfo.address; });

			/* Get the tovalue, removing value from inputs */
			d.value = 0;
			d.to.forEach(to => {
				d.value += to.value;
			});

			if (!d.from && frominfo.from) {
				d.from = frominfo.from;
			}

			d.fromcountry = frominfo.country;
			d.fromaddress = frominfo.address;

			try {
				await d.save();
				log.job.debug('donation', `Unhandled donation ${d.txid} is from ${d.from || d.fromaddress}`);
				telegramHelper.notify(`Detect unhandled donation ${d.txid} is from ${d.from || d.fromaddress} (fiat: ${d.fiatdonation != null ? 'true' : 'false'})`);
				log.job.debug('donation', `Saved unhandled donation: ${tx.tx}`);
			} catch (err) {
				log.job.error('donation', `Failed to save unhandled donation: ${tx.tx}: ${err}`);
			}
		} catch (err) {
			return log.job.error('donation', `Unhandled donation ${d.txid}, failed to get guessfrom results`);
		}
	};


	log.job.debug('donation', `Checking unhandled transactions`);
	const users = await User.find({ $or: [{ usertype: 'npo' }, { usertype: 'company' }] }, 'username country usertype').exec();

	await Async.forEach(users, async owner => {
		const wallets = await Wallet.find({
			owner: owner.username,
			$or: [
				{ $and: [{ ismultisig: true }, { 'multisig.active': true }] },
				{ ismultisig: false }
			]
		}, 'owner country address multisig.active ismultisig').exec();

		await Async.forEach(wallets, async (w) => {
			let txs = [];
			try {
				txs = await Blockchain.getTransactions(w.address);
			} catch (err) {
				return log.job.error('donation', `Can't get transactions for ${w.address}`);
			}

			/* Store out transactions from NPOs */
			const outtxs = {};

			txs.forEach(tx => {
				if (!tx.in)
					outtxs[tx.tx] = true;
			});

			await Async.forEach(txs, async tx => {
				/* Avoid out txs */
				if (tx.in === false) return;

				/* Check if it's a tx from another NPO */
				if (tx.tx in outtxs) return;

				await handleTx(owner, w, tx);
			});
		});
	});
};


/* Periodic check for anonymous donation; we try to find a transaction with an exact value.
	If the expiry is reached, we remove the transaction. */
export async function anonymousDonationCheck() {
	const donations: $DonationDocument[] = await Donation.find({ status: 'waiting', expiry: { $ne: null } }).exec();
	log.job.debug('donation', `Checking ${donations.length} anonymous donations`);

	await Async.forEach(donations, async (d: $DonationDocument) => {
		/* Check for expiration */
		if (moment().diff(d.expiry) > 0) {
			log.job.debug('donation', `Anonymous donation expired: ${d.txid}`);
			return Donation.remove({ _id: d._id }, err => { });
		}

		/* Get latest transactions */
		let txs = [];
		try {
			txs = await Blockchain.getTransactions(d.to[0].address);
		} catch (err) {
			return log.job.error('donation', `Error on getting transaction list for ${d.to[0].address}: ${err}`);
		}

		if (txs == null) {
			return log.job.error('donation', `Error on getting transaction list for ${d.to[0].address}: null`);
		}

		await Async.forEach(txs, async (tx) => {
			/* Check the value of the tx */
			try {
				const txto = await guessTxTo(tx.tx);

				if (txto.filter(t => t.value == d.value).length == 0 && tx.value != d.value)
					return;
			} catch (err) {
				if (tx.value != d.value)
					return;
			}


			/* Check if another donation belong to this transaction
			 * The transaction has been already registered as an unhandled donation; we can replace the donation
			 * with the waiting widget donation (it should never happen, but it's a remote possibility) 
			 */
			const ds = await DonationModel.getByTxID(tx.tx);

			if (ds != null) {
				if (moment(ds.time) > moment().subtract(1, 'hour'))
					await Donation.findByIdAndRemove(ds._id).exec();
				else
					return;
			}

			d.txid = tx.tx;
			d.status = 'broadcasted';
			d.expiry = null;
			d.time = new Date();

			try {
				const frominfo = await guessTxFrom(tx.tx);
				if (!d.from && frominfo.from) {
					d.from = frominfo.from;
				}
				d.fromcountry = frominfo.country;
				d.fromaddress = frominfo.address;

				log.job.debug('donation', `Anonymous donation ${d.txid} is from ${d.from || d.fromaddress}`);

				try {
					await d.save();
					log.job.debug('donation', `Saved anonymous donation: ${d.txid}`);
					telegramHelper.notify(`Detect anonymous donation ${d.txid} is from ${d.from || d.fromaddress} (fiat: ${d.fiatdonation != null ? 'true' : 'false'})`);
				} catch (err) {
					log.job.error('donation', `Failed to save anonymous donation ${d.txid}: ${err}`);
				}
			} catch (err) {
				try {
					await d.save();
					log.job.debug('donation', `Saved anonymous donation: ${d.txid}`);
					telegramHelper.notify(`Detect anonymous donation ${d.txid}`);
				} catch (err) {
					log.job.error('donation', `Failed to save anonymous donation: ${d.txid}: ${err}`);
				}
			}
		});
	});
}

export async function checkDonationExpiration() {
	const donations = await Donation.find({ $or: [{ status: 'waiting' }, { status: 'signing' }] }).exec();
	await Async.forEach(donations, async (d) => {
		if (moment(d.time) < moment().subtract(60, 'minutes')) {
			await Donation.remove({ _id: d._id });
			log.job.debug('donation', `Removed expired waiting donation: ${d._id}`);
		}
	});
}


/** Update user sent donations number and volume */
export async function updateSent() {
	log.job.debug('donation', `Updating user sent donations`);

	/* For user */
	const res: { _id: string; n: number; volume: number }[] = await Donation.aggregate()
		.match({ status: 'confirmed' })
		.group({
			_id: "$from",
			volume: { $sum: "$value" },
			n: { $sum: 1 },
		})
		.exec();

	Async.forEach(res, async r => {
		await User.updateOne({ username: r._id }, { $set: { donated: r.volume, donateddonations: r.n } }).exec();
	});
}


/** Update user, event, project donations number and volume */
export async function updateReceived() {
	log.job.debug('donation', `Updating project, event and user received donations`);

	/* For user */
	const resu: { _id: string; n: number; volume: number }[] = await Donation.aggregate()
		.match({ status: 'confirmed' })
		.unwind('to')
		.group({
			_id: "$to.user",
			volume: { $sum: "$to.value" },
			n: { $sum: 1 },
		})
		.exec();

	Async.forEach(resu, async r => {
		await User.updateOne({ username: r._id }, { $set: { received: r.volume, receiveddonations: r.n } }).exec();
	});

	/* For projects */
	const resp: { _id: string; n: number; volume: number }[] = await Donation.aggregate()
		.match({ status: 'confirmed' })
		.unwind('to')
		.group({
			_id: "$to.project",
			volume: { $sum: "$to.value" },
			n: { $sum: 1 },
		})
		.exec();

	Async.forEach(resp, async r => {
		await Project.updateOne({ _id: r._id }, { $set: { received: r.volume, receiveddonations: r.n } }).exec();

		try {
			const project = await Project.findOne({ _id: r._id }, 'currency pending used target end').exec();

			if (project.end == null && project.target < (project.used + await Blockchain.convertCurrency(project.pending, 'BTC', project.currency))) {
				project.end = new Date();
				await project.save();
			}
		} catch (err) { }
	});

	/* For campaigns */
	/* 
	const resc = await Donation.aggregate()
		.match({ status: 'confirmed', campaign: { $ne: null } })
		.group({
			_id: "$campaign",
			volume: { $sum: "$value" },
			volume_EUR: {$sum: "$value_historic.eur"},
			volume_GBP: {$sum: "$value_historic.gbp"},
			volume_USD: {$sum: "$value_historic.usd"},
			n: { $sum: 1 },
		})
		.exec();

	Async.forEach(resc, async r => {
		const campaign = await Campaign.findOne({_id: r._id}).exec();
		campaign.received = r.volume;
		campaign.receiveddonations = r.n;
		campaign.receivedconverted = r.volume;
		if (campaign.currency != 'BTC')
			campaign.receivedconverted = r['volume_' + campaign.currency];
		// TODO: manca la percentage
		await campaign.save();
	});
	*/

	/* For event */
	const rese: { volume: number; n: number; _id: string }[] = await Donation.aggregate()
		.match({ status: 'confirmed' })
		.group({
			_id: "$event",
			volume: { $sum: "$value" },
			n: { $sum: 1 },
		})
		.exec();

	Async.forEach(rese, async r => {
		await Event.updateOne({ _id: r._id }, { $set: { donationsvolume: r.volume, donations: r.n } }).exec();
	});
}
