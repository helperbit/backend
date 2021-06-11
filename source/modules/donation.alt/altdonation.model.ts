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
import ModelOfDocument from "../model_of_document";

type AltStatus = 'WAITING_FOR_DEPOSIT'| 'DEPOSIT_RECEIVED'| 'DEPOSIT_CONFIRMED'| 'EXECUTED'| 'CANCELED'| 'EXPIRED'| 'DRAFT'| 'NEEDS_REFUND'| 'REFUNDED';
type AltPaymentStatus = 'PENDING'| 'UNDERPAY_RECEIVED'| 'UNDERPAY_CONFIRMED'| 'PAYMENT_RECEIVED'| 'PAYMENT_CONFIRMED'| 'OVERPAY_RECEIVED'| 'OVERPAY_CONFIRMED';

const statusList = ['WAITING_FOR_DEPOSIT', 'DEPOSIT_RECEIVED', 'DEPOSIT_CONFIRMED', 'EXECUTED', 'CANCELED', 'EXPIRED', 'DRAFT', 'NEEDS_REFUND', 'REFUNDED'];
const paymentStatusList = ['PENDING', 'UNDERPAY_RECEIVED', 'UNDERPAY_CONFIRMED', 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'OVERPAY_RECEIVED', 'OVERPAY_CONFIRMED'];

const AltDonationSchema = new Schema({
	donation: { type: Schema.Types.ObjectId },
	currency: String,
	address: String,
	amount: Number,
	order: String,
	expiry: Date,
	confirmations: { type: String, default: '' },
	status: { type: String, enum: statusList, default: 'WAITING_FOR_DEPOSIT' },
	paymentstatus: { type: String, enum: paymentStatusList, default: 'PENDING' },
	time: { type: Date, default: Date.now },
	refundaddress: { type: String, default: null },
	toaddress: { type: String }
});


export interface $AltDonationDocument extends Document {
	donation: ObjectId;
	amount: number;
	address: string;
	order: string;
	expiry?: Date;
	confirmations: string;
	currency: string;
	status: AltStatus;
	paymentstatus: AltPaymentStatus;
	time: Date;
	refundaddress: string;
	toaddress: string;
}



export const AltDonation: Model<$AltDonationDocument> =
	model<$AltDonationDocument>('AltDonation', AltDonationSchema);


export class AltDonationModel extends ModelOfDocument<$AltDonationDocument> {
	static getByID(id: string | ObjectId, selector?: string) {
		return AltDonation.findById(id, selector).exec();
	}
}
