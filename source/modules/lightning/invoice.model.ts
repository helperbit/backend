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
import ModelOfDocument from "../model_of_document";
// mongoose.Promise = global.Promise;

export type InvoiceStatus = 'unpaid' | 'expired' | 'paid';

const LightningInvoiceSchema = new Schema({
	status: { type: String, enum: ['unpaid', 'expired', 'paid'], default: 'unpaid' },
	msatoshi: { type: Number },
	metadata: { type: Schema.Types.Mixed, default: {} },
	invoiceid: { type: String, index: true },
	payreq: { type: String, index: true },
	rhash: { type: String, index: true },
	expires_at: { type: Date, default: Date.now },
	created_at: { type: Date, default: Date.now },
	user: { type: String, default: null }
});

export interface $LightningInvoiceDocument extends Document {
	status: InvoiceStatus;
	msatoshi: number;
	metadata: any;
	invoiceid: string;
	payreq: string;
	rhash: string;
	expires_at: Date;
	created_at: Date;
	user?: string;
}

export const LightningInvoice: Model<$LightningInvoiceDocument> =
	model<$LightningInvoiceDocument>('LightningInvoice', LightningInvoiceSchema);


export class LightningInvoiceModel extends ModelOfDocument<$LightningInvoiceDocument> {
	static getByID(id, selector?: string) {
		return LightningInvoice.findById(id, selector).exec();
	}

	static getByInvoiceID(id, selector?: string) {
		return LightningInvoice.findOne({ invoiceid: id }, selector).exec();
	}
}
