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
import flypme = require('../../helpers/flypme')
import telegramHelper = require('../../helpers/telegram');
import { Async } from "../../helpers/async";
import { $AltDonationDocument, AltDonation, AltDonationModel } from './altdonation.model';
import { $DonationDocument, Donation, DonationModel } from '../donation/donation.model';

const moduleName = 'donation.alt';

/** Check pending altdonations */
export async function expiredStatusCheck() {
	const adonations = await AltDonation.find({
		$or: [
			{ status: 'EXPIRED' },
			{ status: 'CANCELED' },
			{ status: 'DRAFT' }
		]
	}).exec();

	if (adonations == null)
		return;

	adonations.forEach((d) => {
		if (moment(d.time) < moment().subtract(45, 'minutes')) {
			log.job.debug(moduleName, `Expired: ${d.order}`);
			return AltDonation.remove({ _id: d._id }, err => { });
		}
	});
}

export async function executedStatusCheck() {
	const donations: $DonationDocument[] = await Donation.find({ altdonation: { $ne: null }, status: 'waiting' }).exec();

	Async.forEach(donations, async (d: $DonationDocument) => {
		const adon = await AltDonationModel.getByID(d.altdonation);
		if (adon.status != 'EXECUTED')
			return;

		log.job.debug(moduleName, `Checking ${adon.order} executed alt donation (flypme) for txid`);

		let res = null;
		try {
			res = await flypme.getOrderInfo(adon.order);
		} catch (err) {
			return;
		}
		if (res.txid) {
			d.txid = res.txid;
			d.status = 'broadcasted';

			await d.save();
			log.job.debug(moduleName, `Donation ${d.txid} associated to flypme order: ${adon.order}`, { telegram: true });
		}
	});
}

export async function pendingStatusCheck() {
	const adonations: $AltDonationDocument[] = await AltDonation.find({
		$or: [
			{ status: 'WAITING_FOR_DEPOSIT' },
			{ status: 'DEPOSIT_RECEIVED' },
			{ status: 'DEPOSIT_CONFIRMED' },
			{ status: 'NEEDS_REFUND' }
		]
	}).exec();

	if (adonations === null)
		return;

	log.job.debug(moduleName, `Checking ${adonations.length} pending alt donation (flypme)`);

	Async.forEach(adonations, async (adon: $AltDonationDocument) => {
		let res = null;
		try {
			res = await flypme.checkOrder(adon.order);
		} catch (err) {
			return;
		}

		if (res.status != adon.status || res.payment_status != adon.paymentstatus) {
			log.job.debug(moduleName, `Donation ${adon.donation} (order: ${adon.order}): ${adon.status} -> ${res.status} (payment: ${adon.paymentstatus} -> ${res.payment_status})`);

			if (res.status != 'EXPIRED') {
				telegramHelper.notify(`${moduleName}: Donation ${adon.donation} (order: ${adon.order}): ${adon.status} -> ${res.status} (payment: ${adon.paymentstatus} -> ${res.payment_status})`);
			}

			adon.status = res.status;
			adon.paymentstatus = res.payment_status;

			if (res.confirmations)
				adon.confirmations = res.confirmations;

			if (res.status != 'WAITING_FOR_DEPOSIT') /* && res.status != 'DEPOSIT_RECEIVED' && res.status != 'DEPOSIT_CONFIRMED')*/ {
				adon.expiry = null;
				const donation = await DonationModel.getByID(adon.donation);
				if (donation === null) {
					try {
						await adon.save();
					} catch (err) {
						log.job.error(moduleName, `Error: ${err}`);
					}
				} else {
					donation.expiry = null;
					try {
						await donation.save();
						await adon.save();
					} catch (err) {
						log.job.error(moduleName, `Error donation: ${err}`);
					}
				}
			} else {
				try {
					await adon.save();
				} catch (err) {
					log.job.error(moduleName, `Error: ${err}`);
				}
			}
		} else if (res.confirmations) {
			adon.confirmations = res.confirmations;

			try {
				await adon.save();
			} catch (err) {
				log.job.error(moduleName, `Error: ${err}`);
			}
		}
	});
}
