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
import { Blockchain } from "../../blockchain";
import types = require('../../helpers/types');


const TimeLockTransactionSchema = new Schema({
	txid: { type: String, default: null },
	status: { type: String, enum: ['creation', 'signing', 'signed'], default: 'creation' },
	utxos: [{ tx: String, n: Number, value: Number }],
	scripttype: { type: String, enum: ['p2wsh', 'p2sh', 'p2sh-p2wsh'], default: 'p2sh-p2wsh' },
	onlycheck: { type: Boolean, default: false },
	pubkeys: [String],
	locktime: { type: Number, required: true },
	hex: { type: String },
	recoveryhex: { type: String },
	from: { type: String, required: true },
	to: { type: String },
	toalternative: { type: String },
	value: { type: Number },
	fee: { type: Number },
	time: { type: Date, default: Date.now },

	wallet: {
		id: { type: Schema.Types.ObjectId, required: true },
		address: String,
		label: String,
		ismultisig: Boolean,
		hardware: { type: String, enum: types.hardwareWallets }
	},

	/* Multisig data */
	hardwareadmins: [String],
	hardwaretypes: [{ type: String, enum: types.hardwareWallets }],
	signers: [String],
	admins: [String],
	n: { type: Number },

	/* Fee part */
});


export interface $TimeLockTransactionDocument extends Document {
	txid: string;
	status: 'creation' | 'signing' | 'signed';
	pubkeys: string[];
	utxos: Blockchain.UTXO[];
	scripttype: 'p2wsh' | 'p2sh' | 'p2sh-p2wsh';
	onlycheck: boolean;
	locktime: number;
	hex: string;
	recoveryhex: string;
	from: string;
	to: string;
	toalternative: string;
	value: number;
	fee: number;
	time: Date;

	wallet: {
		id: ObjectId;
		label: string;
		address: string;
		ismultisig: boolean;
		hardware: string;
	};

	/* Multisig data */
	hardwareadmins: string[];
	hardwaretypes: string[];
	signers: string[];
	admins: string[];
	n: number;

	/* Fee data */
	// feehex: string;
	// feevalue: number;
	// feeto: string;
}


export const TimeLockTransaction: Model<$TimeLockTransactionDocument> =
	model<$TimeLockTransactionDocument>('TimeLockTransaction', TimeLockTransactionSchema);


export class TimeLockTransactionModel extends ModelOfDocument<$TimeLockTransactionDocument> {
	static getByID(id, selector) {
		return TimeLockTransaction.findById(id, selector).exec();
	}
}

