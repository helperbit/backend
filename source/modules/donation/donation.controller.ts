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
import * as bitcoinjs from 'bitcoinjs-lib';
import moment = require('moment');
import telegramHelper = require('../../helpers/telegram');
import mailHelper = require('../../helpers/mail');
import error = require('../../error');
import log = require('../../log');
import conf = require('../../conf');
import { Blockchain } from "../../blockchain";
import schemaValidator = require('../../helpers/schema-validator');
import { prepareTransaction, Conversion } from '../../helpers/bitcoin';
import badgeController = require('../user.badge/badge.controller');
import notificationController = require('../notification/notification.controller');
import altDonationController = require('../donation.alt/altdonation.controller');
import campaignController = require('../campaign/campaign.controller');
import { $DonationDocument, DonationModel, Donation } from './donation.model';
import { Wallet } from "../wallet/wallet.model";
import { $EventDocument, EventModel, Event } from "../event/event.model";
import { $ProjectDocument, ProjectModel, Project } from "../project/project.model";
import { $UserDocument, User } from "../user/user.model";
import { Transaction } from "../wallet.transaction/transaction.model";
import { CampaignModel } from "../campaign/campaign.model";
import { QueryHelper } from "../../helpers/query";
import { tokenize } from "../../helpers/crypto";
import { Async } from "../../helpers/async";


/* GET api/donation/:txid */
export async function getByTXID(req: Request, res: Response) {
	const donation = await DonationModel.getByTxID(req.params.txid);
	if (donation !== null) {
		res.status(200);
		res.json(donation);
	} else {
		error.response(res, 'E2');
	}
};


/* GET api/donation/i/:id */
export async function getByID(req: Request, res: Response) {
	const donation = await DonationModel.getByID(req.params.id);
	if (donation !== null) {
		res.status(200);
		res.json(donation);
	} else {
		error.response(res, 'E2');
	}
};

/* GET api/donation/:txid/gift */
export async function getGiftDonation(req: Request, res: Response) {
	const donation: $DonationDocument = await DonationModel.getByTxID(req.params.txid, '+gift');
	if (donation !== null) {
		if (donation.gift.token != req.query.token)
			return error.response(res, 'E6');

		donation.gift.email = null;
		donation.gift.token = null;
		res.status(200);
		res.json(donation);
	} else {
		error.response(res, 'E2');
	}
};


/* GET api/donation/:txid/askinvoice */
export async function requestInvoice(req: any, res: Response) {
	if (req.user.trustlevel < 50)
		return error.response(res, 'E');

	const donation: $DonationDocument = await DonationModel.getByTxID(req.params.txid);
	await Async.forEach(donation.to, async (dto) => {
		if (dto.type == 'npo' && dto.user) {
			await notificationController.notify({
				user: dto.user,
				email: true,
				code: 'donationInvoiceRequest',
				data: { txid: donation.txid, user: donation.from },
				redirect: donation.txid + '/invoice'
			});
		}
	});

	donation.invoicestatus = 'requested';
	await donation.save();

	res.status(200);
	res.json({});
};

/* [GET|POST] /donations/graph version 2 */
export function getGraph(to: string) {
	return async (req: Request, res: Response) => {
		const createQuery = async () => {
			const query: any = {
				$and: [
					{ $or: [{ status: 'broadcasted' }, { status: 'confirmed' }] }
				]
			}; // $in: ['broadcasted', 'confirmed']} };
			let end = null;
			let start = null;

			if (('start' in req.body) && ('end' in req.body)) {
				query['$and'].push({ $and: [{ 'time': { $gt: req.body.start } }, { 'time': { $lt: req.body.end } }] });
				start = req.body.start;
				end = req.body.end;
			}

			const donquery = JSON.parse(JSON.stringify(query));
			const txquery = JSON.parse(JSON.stringify(query));

			switch (to) {
				case 'event':
					const eid = req.params.id;
					donquery['$and'].push({ event: eid });
					return { donquery: donquery, txquery: txquery };

				case 'user':
					const uname = req.params.name;
					donquery['$and'].push({ $or: [{ 'from': uname }, { 'to.user': uname }] });
					txquery['$and'].push({ $or: [{ 'from': uname }, { 'to.user': uname }] });

					return { donquery: donquery, txquery: txquery };

				case 'project':
					const pid = req.params.id;
					donquery['$and'].push({ 'to.project': pid });

					const project = await ProjectModel.getByID(pid, 'owner receiveaddress');
					if (project && project.receiveaddress)
						txquery['$and'].push({ fromaddress: project.receiveaddress });
					else if (project && !project.receiveaddress)
						txquery['$and'].push({ from: project.owner });

					return { donquery: donquery, txquery: txquery };

				default:
					return { donquery: donquery, txquery: txquery };
			}
		};

		const queries = await createQuery();
		const donquery = queries.donquery;
		const txquery = queries.txquery;

		const nodes = {};
		let edges = [];
		const usertodo = [];
		const addresstodo = [];
		let anoni = 0;
		const txids = {};
		const receiveaddress = {};

		const donations = await Donation.find(donquery).sort({ time: 'desc' }).limit(500).exec();

		edges = donations.map(d => {
			const dfrom = d.from || d.fromaddress;

			if (!(dfrom in nodes)) {
				/* Address */
				if (d.from == null) {
					nodes[dfrom] = {
						usertype: 'address',
						username: dfrom,
						avatar: null,
						fullname: 'A' + anoni,
						received: 0,
						donated: d.value
					};
					anoni += 1;
				}
				/* User */
				else {
					usertodo.push(dfrom);
				}
			}
			else if (dfrom in nodes && nodes[dfrom].usertype == 'address') {
				nodes[dfrom].donated += d.value;
			}

			txids[d.txid] = true;
			return {
				type: 'donation',
				time: d.time,
				id: d.txid,
				from: dfrom,
				value: d.value,
				altdonation: d.altdonation != null,
				fiatdonation: d.fiatdonation != null,
				to: d.to.map(to => {
					const tou = to.user || to.address;

					if (!(tou in nodes)) {
						/* Address */
						if (to.type == 'address') {
							nodes[tou] = {
								usertype: 'address',
								username: tou,
								avatar: null,
								fullname: 'A' + anoni,
								received: 0,
								donated: d.value
							};
							addresstodo.push(tou);
							anoni += 1;
						}
						/* User */
						else {
							usertodo.push(tou);
						}
					}

					return {
						value: Math.floor(to.value * 10000) / 10000,
						username: tou
					}
				})
			};
		});

		let transactions = [];
		if (to != 'event')
			transactions = await Transaction.find(txquery).sort({ time: 'desc' }).limit(25).exec();

		for (let i = 0; i < transactions.length; i++) {
			const t = transactions[i];

			if (t.txid in txids)
				continue;

			if (!(t.to in nodes)) {
				/* Address */
				nodes[t.to] = {
					usertype: 'address',
					username: t.to,
					avatar: null,
					fullname: 'A' + anoni,
					received: 0,
					donated: t.value
				};
				addresstodo.push(t.to);
				anoni += 1;
			}

			edges.push({
				time: t.time,
				type: 'transaction',
				id: t.txid,
				from: t.from,
				to: [{ username: t.to, value: Math.floor(t.value * 10000) / 10000 }],
				value: Math.floor(t.value * 10000) / 10000
			});
		};

		const wallets = await Wallet.find({ address: { $in: addresstodo } }, 'owner address').exec();

		for (let i = 0; i < wallets.length; i++)
			usertodo.push(wallets[i].owner);

		for (let j = 0; j < edges.length; j++) {
			for (let i = 0; i < edges[j].to.length; i++) {
				const to1 = wallets.filter(w => { return edges[j].to[i].username == w.address; });
				if (to1.length >= 1)
					edges[j].to[i].username = to1[0].owner;
			}
		}

		const users = await User.find({ banned: false, username: { $in: usertodo } }, 'username usertype avatar fullname received donated').exec();
		for (let i = 0; i < users.length; i++) {
			const u = users[i];

			nodes[u.username] = {
				usertype: u.usertype,
				username: u.username,
				avatar: u.avatar,
				fullname: u.fullname,
				received: u.received,
				donated: u.donated
			};
		};

		res.status(200);
		res.json({
			nodes: nodes,
			edges: edges
		});
	};
}


/* GET api/event/:id/donations/chart | api/user/:name/donations/chart | api/project/:id/donations/chart */
export function getChart(ty: string) {
	return async (req: Request, res: Response) => {
		const query: { status: any; $or?: any; event?: string; time: any } = { time: { '$gt': new Date(Date.parse(moment([2016]).format())) }, status: { $in: ['broadcasted', 'confirmed'] } };
		const period = "week";

		if (ty == 'user') {
			if (!('name' in req.params))
				return error.response(res, 'E');

			query.$or = [{ 'to.user': req.params.name }];
		}
		else if (ty == 'event') {
			if (!('id' in req.params))
				return error.response(res, 'E');
			query.event = req.params.id;
		}
		else if (ty == 'project') {
			if (!('id' in req.params))
				return error.response(res, 'E');

			query.$or = [{ 'to.project': req.params.id }];
		}

		const data: { _id: { week: number; year: number }; amount: number }[] = await Donation.aggregate()
			.unwind("to")
			.match(query)
			.project({
				// day : { $dayOfYear : "$time" },
				year: { $year: "$time" },
				week: { $week: "$time" },
				_id: 1,
				value: "$to.value"
			})
			.group({
				_id: {
					// day : "$day",
					week: "$week",
					year: "$year"
				},
				amount: {
					$sum: "$value"
				}
			})
			.group({
				_id: {
					// day : "$_id.day",
					week: "$_id.week",
					year: "$_id.year"
				},
				amount: {
					$sum: "$amount"
				}
			})
			.sort({
				"_id.year": 1,
				"_id.week": 1
			})
			.exec();

		res.status(200);
		res.json({
			chart: data,
			period: period
		});
	};
}


/* GET/POST api/event/:id/donations | api/user/:name/donations | api/project/:id/donations */
export function getList(ty: string) {
	return async (req: Request, res: Response) => {
		const query: { status: any; $or?: any; event?: string; campaign?: string; from?: string; "to.user"?: any } = { status: { $in: ['broadcasted', 'confirmed'] } };
		const flow = req.body.flow || 'in';

		if (ty == 'user') {
			if (!('name' in req.params))
				return error.response(res, 'E');

			if (flow == 'both')
				query.$or = [{ from: req.params.name }, { 'to.user': req.params.name }];
			else if (flow == 'out')
				query.from = req.params.name;
			else if (flow == 'in')
				query['to.user'] = req.params.name;
		}
		else if (ty == 'event') {
			if (!('id' in req.params))
				return error.response(res, 'E');
			query.event = req.params.id;
		}
		else if (ty == 'project') {
			if (!('id' in req.params))
				return error.response(res, 'E');

			query.$or = [{ 'to.project': req.params.id }, { 'project': req.params.id }];
		}
		else if (ty == 'campaign') {
			if (!('id' in req.params))
				return error.response(res, 'E');

			query.campaign = req.params.id;
		}

		const donations = await QueryHelper.pagination(req, Donation, {
			sort: 'desc',
			orderby: 'time',
			query: query
		});
		res.status(200);
		res.json({ donations: donations, count: await Donation.countDocuments(query).exec() });
	};
}



/* Called after transaction confirmation */
export async function confirm(donation: $DonationDocument) {
	let prices = null;
	try {
		prices = await Blockchain.getPrices();
		donation.value_historic = {
			usd: donation.value * prices.usd,
			gbp: donation.value * prices.gbp,
			eur: donation.value * prices.eur
		};
		await donation.save();
	} catch (err) { }


	/* Update campaign statistics */
	if (donation.campaign !== null)
		await campaignController.handleDonation(donation);


	/* Update event donation statistics */
	if (donation.event) {
		const event: $EventDocument = await EventModel.getByID(donation.event);
		if (event !== null) {
			event.donations += 1;
			event.donationsvolume += donation.value;
			await event.save();
		}
	}

	/* Update receive statistics */
	for (let z = 0; z < donation.to.length; z++) {
		const user = await User.findOne({ banned: false, username: donation.to[z].user }).exec();
		if (user == null)
			continue;

		const q: any = {
			owner: user.username, end: null, status: 'approved', $or: [
				{ 'receiveaddress': null },
				{ 'receiveaddress': donation.to[z].address }
			]
		};
		if (donation.event)
			q.event = donation.event;

		const project: $ProjectDocument = await Project.findOne(q).exec();

		if (project !== null) {
			project.received += donation.to[z].value;
			project.pending += donation.to[z].value;
			project.receiveddonations += 1;

			/* Check if project target is reached */
			if (project.end == null && project.target < (project.used + await Blockchain.convertCurrency(project.pending, 'BTC', project.currency, prices)))
				project.end = new Date();

			await project.save();
			donation.to[z].project = project._id;

			if (donation.event && project.event)
				donation.event = project.event;

			await donation.save();
		}

		await notificationController.notify({
			user: user,
			email: true,
			code: 'donationReceived',
			data: { fromcountry: donation.fromcountry, from: (donation.from || donation.fromaddress), amount: donation.to[z].value },
			redirect: donation.txid
		});

		user.received += donation.to[z].value;
		user.receiveddonations += 1;
		await user.save();
	}


	/* Update donor user statistics */
	const user = await User.findOne({ banned: false, username: donation.from }).exec();
	if (user !== null) {
		user.donateddonations += 1;
		user.donated += donation.value;

		/* Update supportedevents */
		if (donation.event !== null && user.supportedevents === undefined) {
			user.supportedevents = [];
		}
		if (donation.event !== null && user.supportedevents.indexOf(donation.event) == -1) {
			user.supportedevents.push(donation.event);
		}
		await user.save();
		if (donation.from)
			await badgeController.updateUserBadges(donation.from);
	}


	/* Handle donation gift */
	if ('gift' in donation && donation.gift.enabled && donation.gift.message && donation.gift.name) {
		let email = donation.gift.email;
		if (donation.campaign) {
			try {
				const camp = await CampaignModel.getByID(donation.campaign);
				const cown = await User.findOne({ banned: false, username: camp.owner }, 'email').exec();
				email = cown.email;
			} catch (err) { }
		}

		if (email) {
			donation.gift.token = await tokenize(donation.txid + Math.random());

			let text = `An user made a donation using Helperbit.com as a gift for you. Message: "${donation.gift.message}" (from "${donation.gift.name}").`;
			text += `<br>Click <a href="${conf.url}/donation/${donation.txid}/gift?token=${donation.gift.token}">Here</a> to view more details.`;

			text += `<br><hr><br>Un utente ha fatto una donazione utilizzando Helperbit.com come regalo per te. Messaggio: "${donation.gift.message}" (da "${donation.gift.name}").`;
			text += `<br>Premi <a href="${conf.url}/donation/${donation.txid}/gift?token=${donation.gift.token}">Qui</a> per vedere piu' dettagli.`;

			await mailHelper.send(email,
				`You received a gift donation`,
				text);
			donation.gift.sent = true;
			donation.markModified('gift');
			await donation.save();
		}
	}
};

/* Chaimata dopo una wallet/send, aggiorna le info della donazione e statistiche utenti */
export async function broadcast(res: Response, donid: string, txid: string) {
	// Qua la ricerca e' per txid in quanto contiene l'id della transazione non broadcastata
	const donation: $DonationDocument = await Donation.findOne({ "_id": donid, $or: [{ "status": 'signing' }, { "status": 'waiting' }] }).exec();
	if (donation === null)
		return error.response(res, 'E');

	donation.txid = txid;
	donation.status = 'broadcasted';
	donation.time = new Date();
	donation.save();

	/* Send back the transaction id */
	res.status(200);
	res.json({ txid: txid, donation: donation._id });

	let tos = donation.to.map((to) => { return ` - ${to.address} (${to.user || ''}): ${to.value} BTC\n`; }).reduce((a, b) => { return a + b; });
	if (donation.event)
		tos += `to event ${donation.event}`;
	telegramHelper.notify(`${txid} - New donation broadcasted from ${donation.from || 'anonymous'} to:\n${tos} of value ${donation.value} BTC`);
};


/* Create a donation for an event */
export async function createEventDonation(req: any, res: Response) {
	const address = req.body.address;
	const fee = parseFloat(req.body.fee);
	const usersdest = req.body.users;
	const eventid = req.params.event;
	const value = parseFloat(req.body.value);

	/* Check if 'address' belong to user */
	const wallet = await Wallet.findOne({ address: address, owner: req.username }, 'srvkey address scripttype pubkeys multisig ismultisig').exec();

	if (wallet === null)
		return error.response(res, 'E2');

	/* Check if balance is enough */
	let user = null;
	try {
		const balance = await Blockchain.getBalance(wallet.address);
		if (Number(balance.balance) + Number(balance.unconfirmed) < (value + fee))
			return error.response(res, 'EW1');

		user = await User.findOne({ banned: false, username: req.username }).exec();

		if (user === null)
			return error.response(res, 'E');
	} catch (err) {
		return error.response(res, 'E');
	}


	const event = await Event.findOne({ _id: eventid }).exec();
	if (event === null)
		return error.response(res, 'E2');

	let users: $UserDocument[] = await User.find({
		username: { $in: Object.keys(usersdest) },
		receiveaddress: { $ne: '' },
		banned: false
	}, 'usertype username receiveaddress').exec();

	/* Remove helperbit, it will be used the coldwallet */
	users = users.filter(u => u.username != 'helperbit');

	if (users.length === 0)
		return error.response(res, 'EW4');

	const donation = new Donation();
	donation.status = 'signing';
	donation.value = value;
	donation.from = req.username;
	donation.event = event._id;

	/* To and From countries */
	if (event.affectedcountries.length > 0)
		donation.tocountry = event.affectedcountries[0];
	donation.fromcountry = user.country;

	const metadata = Blockchain.meta.toOPReturn(
		Blockchain.meta.EventDonationMetadata(event, donation.fromcountry, donation.tocountry));

	let txb: bitcoinjs.Psbt = null;
	let utxos = [];
	const addresses = users.map(u => { return { address: u.receiveaddress, value: usersdest[u.username] }; });

	if ('helperbit' in usersdest) {
		donation.to.push({ user: 'helperbit', type: 'company', value: usersdest.helperbit, address: conf.blockchain.coldwallet });
		addresses.push({ address: conf.blockchain.coldwallet, value: Conversion.toSatoshi(usersdest.helperbit) });
	}

	try {
		const res = await prepareTransaction({
			wallet: wallet,
			value: value,
			fee: fee,
			addresses: addresses
		});
		txb = res.psbt;
		utxos = res.utxos
	} catch (err) {
		return error.response(res, err);
	}

	try {
		for (let i = 0; i < users.length; i++) {
			const u = users[i];
			donation.to.push({ type: u.usertype, user: u.username, value: usersdest[u.username], address: u.receiveaddress });
		}

		txb.addOutput({ script: metadata, value: 0 });

		/* Sign with server key */
		txb.signAllInputs(bitcoinjs.ECPair.fromWIF(wallet.srvkey, conf.blockchain.network));

		/* Return hex */
		const txhex = txb.toHex();
		donation.txid = donation._id; // tx.getId();

		await donation.save();
		res.status(200);
		res.json({
			donation: donation._id,
			txhex: txhex,
			fee: fee,
			value: value,
			utxos: utxos
		});
	} catch (err) {
		log.critical('Donation', `Donation catch: ${err}`, req);
		error.response(res, 'E');
	}
};


/* GET api/user/:name/donate */
/* GET api/project/:id/donate */
export function getDonationAddress(type: string) {
	return async (req: any, res: Response) => {
		if (!req.query || !req.query.amount)
			return error.response(res, 'E3');

		let amount = req.query.amount;
		const extend = req.query.extend == 'true' || false;
		const altcurrency = req.query.altcurrency || null;
		const campaign = req.query.campaign || null;
		let address = null;

		const donation: $DonationDocument = new Donation();
		donation.txid = donation._id;
		donation.status = 'waiting';
		donation.value = amount;
		donation.from = null;
		donation.campaign = campaign;

		if (req.query.giftmessage) {
			donation.gift = {
				enabled: true,
				message: req.query.giftmessage,
				name: req.query.giftname,
				email: req.query.giftemail
			}
		}

		if (req.username) {
			donation.from = req.username;
		}

		if (type == 'user') {
			const name = req.params.name;
			const owner = await User.findOne({ banned: false, username: name }, 'receiveaddress username usertype').exec();
			if (owner == null)
				return error.response(res, 'E');

			if (schemaValidator.addressCheck(owner.receiveaddress)) {
				amount = Conversion.floorToSatoshi(amount + Conversion.toBitcoin(Math.floor(Math.random() * 500)));
				address = owner.receiveaddress;
			} else {
				return error.response(res, 'E');
			}

			donation.to = [
				{
					user: owner.username,
					value: amount,
					type: owner.usertype,
					address: address
				}
			];

			if (owner.country) {
				donation.tocountries = [owner.country];
				donation.tocountry = owner.country;
			}
		} else if (type == 'project') {
			const id = req.params.id;

			const project = await Project.findOne({ _id: id }, 'owner receiveaddress countries event').exec();

			if (project === null)
				return error.response(res, 'E2');

			const owner = await User.findOne({ banned: false, username: project.owner }, 'receiveaddress username usertype').exec();

			/* We add some fuzzy satoshis for distinguish different transactions */
			amount = Conversion.floorToSatoshi(amount + Conversion.toBitcoin(Math.floor(Math.random() * 500)));

			if ('receiveaddress' in project && schemaValidator.addressCheck(project.receiveaddress))
				address = project.receiveaddress;
			else
				address = owner.receiveaddress;

			donation.value = amount;
			donation.to = [
				{
					user: owner.username,
					value: amount,
					type: owner.usertype,
					address: address,
					project: project._id
				}
			];

			if (project.countries.length > 0) {
				donation.tocountries = project.countries;
				donation.tocountry = project.countries[0];
			}

			if (project.event)
				donation.event = project.event;
		}

		if (address == null)
			return error.response(res, 'E');
		if (conf.blockchain.testnet && altcurrency)
			address = '3EJVxSDVHp7TkGuUKEexLDssKfsWJHXTk9';

		if (altcurrency) {
			try {
				const altdon = await altDonationController.create(donation, altcurrency, address);

				if (req.query.username) {
					donation.from = req.query.username;
				}
				donation.altdonation = altdon._id;

				await altdon.save();
				await donation.save();
				res.status(200);
				res.json({ altcurrency: altcurrency, altaddress: altdon.address, altamount: altdon.amount, address: address, amount: amount, expiry: donation.expiry, donation: donation._id });
			} catch (err) {
				console.log("Unable to create altdonation: ", err);
				return error.response(res, 'E');
			}
		} else {
			if (extend)
				donation.expiry = moment().add(90, 'minute').toDate();
			else
				donation.expiry = moment().add(30, 'minute').toDate();

			await donation.save();
			res.status(200);
			res.json({ address: address, amount: amount, expiry: donation.expiry, donation: donation._id });
		}
	}
}
