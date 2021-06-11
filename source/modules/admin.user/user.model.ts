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
import { tokenize } from "../../helpers/crypto";
import bcrypt = require('bcrypt');


const AdminUserSchema = new Schema({
	email: { type: String, unique: true, required: true, index: true, lowercase: true },
	username: { type: String, unique: true, required: true, index: true, lowercase: true },
	password: { type: String, required: true, select: false },
	privileges: [ { type: String, enum: ['kyc', 'admin', 'operator', 'kyc-thirdparty']} ],
	keyhandle: { type: String, default: '' },
	publickey: { type: String, default: '' },

	lastpasswordchange: { type: Date, default: Date.now },
	lastlogin: { type: Date, default: Date.now },
	lastip: { type: String, default: null },
	iphistory: { type: Array, default: [] },
});


export interface $AdminUserDocument extends Document {
	email: string;
	username: string;
	password: string;
	privileges: ('kyc' | 'admin' | 'operator' | 'kyc-thirdparty')[];
	keyhandle: string;
	publickey: string;

	lastpasswordchange: Date;
	lastlogin: Date;
	lastip: string;
	iphistory: string[];

	verifyPassword(password: string): boolean;
}


export interface $AdminUserModel extends $AdminUserDocument {}

/* Password update */
AdminUserSchema.pre('save', function (callback) {
	const user = this as $AdminUserDocument;

	/* Break out if the password hasn't changed */
	if (!user.isModified('password')) return callback();

	/* Password changed so we need to hash it */
	tokenize(user.password, false).then(function (hash) {
		user.password = hash;
		callback();
	}).catch(function (err) {
		callback(err);
	});
});


/* Check inserted password */
AdminUserSchema.methods.verifyPassword = function (password) {
	const th = this;
	return new Promise(function (resolve, reject) {
		bcrypt.compare(password, th.password, function (err, isMatch) {
			if (err) return reject(err);
			resolve(isMatch);
		});
	});
};


export const AdminUser: Model<$AdminUserModel> =
	model<$AdminUserModel>('AdminUser', AdminUserSchema);
