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

import log = require('../../log');
import mailHelper = require('../../helpers/mail');
import fiatDonationController = require('./fiatdonation.controller');
import { $FiatDonationDocument, FiatDonation } from './fiatdonation.model';

const moduleName = 'donation.fiat';

/** Withdraw requested, checking its status */
export async function pendingWithdrawCheck() {
	const fdonations = await FiatDonation.find({ status: 'withdrawrequested' }).exec();
	if (fdonations == null)
		return;

	log.job.debug(moduleName, `Checking ${fdonations.length} paid fiatdonation with withdraw in progress`);

	for (let i = 0; i < fdonations.length; i++) {
		const d = fdonations[i];
		const exchange = fiatDonationController.getExchange(d.exchange);

		try {
			const data = await exchange.checkWithdraw(d.exchangedata.transaction_id);
			if (data.transfer_detail.id) {
				d.txid = data.transfer_detail.id;
				d.status = 'sent';

				try {
					await d.save();

					log.job.debug(moduleName, `Withdraw success for ${d._id}: Txid ${d.txid}`, { telegram: true });

					await mailHelper.send(d.email, `[Helperbit] Donation to ${d.touser} sent`, `Your donation to ${d.touser} of value ${d.value} ${d.currency} (${d.valuebtc}) BTC has been sent correctly. You can view the transaction in the Bitcoin blockchain here: https://blockchain.info/tx/${d.txid}`);
				} catch (err) {
					log.job.error(moduleName, `Error: ${err}`);
				}
			}
		} catch (err) {
			log.job.error(moduleName, `Error on check withdraw: ${err}`);
		}
	}
}

/**
 * Bitcoin to send
 * Check for fiat donations where: is paid (create the withdraw)
 */
export async function toWithdrawCheck() {
	const fdonations: $FiatDonationDocument[] = await FiatDonation.find({ status: 'paid' }).exec();

	if (fdonations == null)
		return;
	// return log.job.error (moduleName, `Can't get paid pending fiat donations from db`);

	log.job.debug(moduleName, `Checking ${fdonations.length} paid fiatdonation pending for withdraw`);

	for (let i = 0; i < fdonations.length; i++) {
		const d = fdonations[i];
		const exchange = fiatDonationController.getExchange(d.exchange);

		try {
			const data = await exchange.createWithdraw(d.valuebtc, d.toaddress);
			d.exchangedata = {
				transaction_id: data.transaction_id
			};
			d.markModified('exchangedata');
			d.status = 'withdrawrequested';

			try {
				await d.save();
				log.job.debug(moduleName, `Withdraw requested for ${d._id}: Withdraw #${data.transaction_id}`, { telegram: true });
			} catch (err) {
				log.job.error(moduleName, `Error: ${err}`);
			}
		} catch (err) {
			log.job.error(moduleName, `Error on create withdraw: ${err}`);
		}
	}
}


export async function checkOrderExecuted(exchange, order, d) {
	if (order.status != 'executed') {
		return log.job.debug(moduleName, `Refill order not yet executed for ${d._id}: Order #${d.exchangedata.order}`);
	}

	d.refillstatus = 'exchanged';

	try {
		await d.save();

		try {
			const balance = await exchange.getBalance('BTC');
			log.job.debug(moduleName, `Current BTC balance for ${d.exchange} is ${balance.balance}`, { telegram: true });
		} catch (err) { }

		log.job.debug(moduleName, `Refill order executed for ${d._id}: Order #${d.exchangedata.order} (bought ${d.valuebtc} BTC)`, { telegram: true });
	} catch (err) {
		log.job.error(moduleName, `Error: ${err}`);
	}
}


/**
 * Refill - placeorder
 * Check for fiatdonation where: bitcoin has been sent, refill status is pending
 */
export async function refillCheck() {
	const fdonations: $FiatDonationDocument[] = await FiatDonation.find({ status: 'sent', 'refillstatus': 'pending' }).exec();

	if (fdonations == null)
		return;
	// return log.job.error (moduleName, `Can't get paid pending fiat donations from db`);

	log.job.debug(moduleName, `Refill: Checking ${fdonations.length} sent fiatdonation pending for refill`);

	for (let i = 0; i < fdonations.length; i++) {
		const d = fdonations[i];
		const exchange = fiatDonationController.getExchange(d.exchange);

		try {
			const data = await exchange.getTicker(d.currency);
			const price = data.last + data.last * 0.035;

			try {
				const order = await exchange.placeOrder(d.currency, d.valuebtc, price);
				d.refillstatus = 'orderplaced';
				d.exchangedata = {
					order: order.id,
					transaction_id: d.exchangedata.transaction_id
				};
				d.markModified('exchangedata');

				await d.save();

				log.job.debug(moduleName, `Refill order created for ${d._id}: Order #${order.id} (buy ${d.valuebtc} BTC)`, { telegram: true });

				await checkOrderExecuted(exchange, order, d);
			} catch (err) {
				log.job.error(moduleName, `Error: ${err}`);
			}
		} catch (err) {
			log.job.error(moduleName, `Failed to get exchange ticker: ${err}`);
		}
	}
}



/**
 * Refill - check placed orders
 */
export async function refillOrdersCheck() {
	const fdonations = await FiatDonation.find({ status: 'sent', 'refillstatus': 'orderplaced' }).exec();

	if (fdonations == null)
		return;
	// return log.job.error (moduleName, `Can't get paid pending fiat donations from db`);

	log.job.debug(moduleName, `Refill: Checking ${fdonations.length} sent fiatdonation pending for open order for refill`);

	for (let i = 0; i < fdonations.length; i++) {
		const d = fdonations[i];
		const exchange = fiatDonationController.getExchange(d.exchange);

		try {
			const order = await exchange.checkOrder(d.currency, d.exchangedata.order);
			await checkOrderExecuted(exchange, order, d);
		} catch (err) {
			log.job.error(moduleName, `Failed to get pending order: ${err}`);
		}
	}
}
