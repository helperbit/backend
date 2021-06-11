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
import { ObjectId } from "bson";

import types = require('../../helpers/types');
import { Blockchain } from "../../blockchain";
import { $TimeLockTransactionDocument } from "../wallet.verify/timelocktransaction.model";
// mongoose.Promise = global.Promise;

const WalletSchema: Schema = new Schema({
	owner: { type: String, required: true },
	address: { type: String, unique: true, required: true },
	srvkey: { type: String, required: true, select: false },
	srvpub: { type: String, required: true, select: false },
	pubkeys: [String],
	label: { type: String, default: 'Default' },
	creationdate: { type: Date, default: Date.now },
	scripttype: { type: String, enum: ['p2wsh', 'p2sh', 'p2sh-p2wsh'], default: 'p2sh-p2wsh' },
	hardware: { type: String, enum: types.hardwareWallets, default: 'none' },

	lasttimelocktransaction: { type: Schema.Types.ObjectId, defulat: null, rel: 'TimeLockTransaction' },
	ismultisig: { type: Boolean, default: false },
	multisig: {
		active: { type: Boolean, default: false },
		doneadmins: [String],
		admins: [String],
		n: { type: Number, default: null },
		hardwareadmins: [String],
		hardwaretypes: [{ type: String, enum: types.hardwareWallets, default: 'none' }]
	}
});


export interface $WalletDocument extends Document {
	owner: string;
	address: string;
	srvkey: string;
	srvpub: string;
	pubkeys: string[];
	label: string;
	creationdate: Date;
	scripttype: 'p2wsh' | 'p2sh' | 'p2sh-p2wsh';
	hardware: string;

	lasttimelocktransaction: ObjectId | $TimeLockTransactionDocument;
	ismultisig: boolean;
	multisig: {
		active: boolean;
		doneadmins: string[];
		admins: string[];
		n: number;
		hardwareadmins: string[];
		hardwaretypes: string[];
	};
}

export const Wallet: Model<$WalletDocument> = model<$WalletDocument>('Wallet', WalletSchema);

export class WalletModel extends ModelOfDocument<$WalletDocument> {
	get address(): string { return this.d.address; }

	isActive(): boolean {
		return !this.d.ismultisig || (this.d.ismultisig && this.d.multisig.active);
	}

	isMultisig(): boolean {
		return this.d.ismultisig;
	}

	getBalance(): Promise<Blockchain.Balance> {
		return Blockchain.getBalance(this.d.address);
	}

	static getByID(id: ObjectId, selector?: string): Promise<$WalletDocument> {
		return Wallet.findById(id, selector).exec();
	}

	static getByOwnerAndAddress(owner, address, selector?: string): Promise<$WalletDocument> {
		return Wallet.findOne({ owner: owner, address: address }, selector).exec();
	}

	static listByOwner(owner: string, selector?: string): Promise<$WalletDocument[]> {
		return Wallet.find({ owner: owner }, selector).exec();
	}

	static listActiveWallets(type: 'multisig' | 'singlesign' | 'all' = 'all', populate?: string, selector?: string): Promise<$WalletDocument[]> {
		let q = {};

		switch (type) {
			case 'multisig':
				q = { ismultisig: true, 'multisig.active': true };
				break;
			case 'singlesign':
				q = { ismultisig: false };
				break;
			case 'all':
				q = { $or: [{ ismultisig: false }, { ismultisig: true, 'multisig.active': true } ] };
				break;
		}

		const qq = Wallet.find(q, selector);
		return populate ? qq.populate(populate).exec() : qq.exec();
	}
}


// export interface $WalletModel extends $WalletDocument {
// 	listByOwner(owner: string, selector?: string): Promise<$WalletDocument[]>,
// 	getByOwnerAndAddress(owner: string, address: string, selector?: string): Promise<$WalletDocument>,
// 	getByID(id: string, selector?: string): Promise<$WalletDocument>
// }
