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

import { Document, Schema, Model, model } from "mongoose";
import { ObjectId } from "bson";
import { $GiftData } from "../../helpers/types";
import ModelOfDocument from "../model_of_document";
import conf = require('../../conf');


/**
 * Flow degli stati
 * 
 * - paid: l'utente ha pagato, i soldi sono arrivati su mistral
 * - withdrawrequested: e' stato cheisto all'exchange di fare il withdraw del quantitativo verso l'utente che ricevera' la donazione
 * - sent: i soldi sono stati effettivamente inviati all'utente beneficiario, e' presente il txid, viene inviata la mail all'utente
 * 
 * - paidtowronguser: l'utente ha pagato, ma nella richiesta e' stato impostato un destinatario non valido
 * - refunded: l'utente e' stato rimborsato (da fare a mano su mistral e impostare su HB)
 * 
 * - paidinvalidbtc: l'utente ha pagato, ma l'amount in btc supera la soglia
 * - refunded: l'utente e' stato rimborsato (da fare a mano su mistral e impostare su HB)
 * 
 * - paidcheckfailed: l'utente ha pagato, ma non son riuscito a verificare l'amount btc
 * - refunded: l'utente e' stato rimborsato
 * - paid: la donazione e' stata markata manualmente come valida
 * 
 * - failedpayment: pagamnto fallito, non ci serve fare nulla
 */
const FiatDonationSchema = new Schema({
	txid: { type: String, default: null },
	status: {
		type: String, enum: [
			'failedpayment',
			'paidcheckfailed', // Il check dell'amount non e' andato a buon fine, azione manuale necessaria
			'paidinvalidbtc', 'paidtowronguser', 'refunded',
			'paid', 'withdrawrequested', 'sent'
		]
	},

	refillstatus: {
		type: String, enum: [
			'none', // Refill non necessario
			'pending', // In attesa
			'orderplaced', // Ordine piazzato
			'exchanged' // Scambiato
		], default: 'none'
	},

	toaddress: { type: String },
	touser: { type: String },

	provider: { type: String, enum: ['mistralpay'], defulat: 'mistralpay' },
	exchange: { type: String, enum: ['therocktrading'], default: 'therocktrading' },

	paymentdata: { type: Schema.Types.Mixed, default: {} },
	exchangedata: { type: Schema.Types.Mixed, default: {} },

	email: { type: String },
	fullname: { type: String, default: null },
	username: { type: String, default: null },
	campaign: { type: String, default: null },

	value: { type: Number },
	currency: { type: String, enum: conf.currency.supported },
	valuebtc: { type: Number },

	time: { type: Date, default: Date.now },

	gift: {
		enabled: { type: Boolean, default: false },
		email: String,
		message: String,
		name: String,
		sent: { type: Boolean, default: false }
	}
});

export type FiatDonationStatus = 'failedpayment' | 'paidcheckfailed' | 'paidinvalidbtc' | 'paidtowronguser' | 'refunded' | 'paid' | 'withdrawrequested' | 'sent';

export interface $FiatDonationDocument extends Document {
	txid: string;
	status: FiatDonationStatus;
	refillstatus: 'none' | 'pending' | 'orderplaced' | 'exchanged';
	toaddress: string;
	touser: string;
	provider: string;
	exchange: string;
	email: string;
	fullname: string;
	username?: string;
	campaign: ObjectId | null;
	value: number;
	currency: string;
	valuebtc: number;
	time: Date;
	paymentdata: any;
	exchangedata: any;
	gift: $GiftData;
}


FiatDonationSchema.statics.getByTxID = function (txid, selector) {
	return this.findOne({ txid: txid }, selector).exec();
};


export const FiatDonation: Model<$FiatDonationDocument> =
	model<$FiatDonationDocument>('FiatDonation', FiatDonationSchema);

export class FiatDonationModel extends ModelOfDocument<$FiatDonationDocument> {
	static getByID(id: string, selector?: string) {
		return FiatDonation.findById(id, selector).exec();
	}

	static getByTxID(txid, selector?: string) {
		return FiatDonation.findOne({ txid: txid }, selector).exec();
	}
}
