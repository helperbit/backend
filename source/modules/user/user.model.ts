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

import { Document, Schema, Model, model, Types } from "mongoose";
import { ObjectId } from "bson";
import { $TString } from "../../helpers/types";
import ModelOfDocument from "../model_of_document";
import { QueryHelper } from "../../helpers/query";

import moment = require('moment');
import bcrypt = require('bcrypt');
import types = require('../../helpers/types');
import conf = require('../../conf');
import { tokenize } from "../../helpers/crypto";
const tags = require('../../data/tags.json');
const badges = require('../../data/badges.json');
import schemaValidator = require('../../helpers/schema-validator');
import { UserVerifyProviders } from "../user.verify";
import { Point } from "geojson";

// mongoose.Promise = global.Promise;

const UserSchema = new Schema({
	email: { type: String, unique: true, required: true, index: true, lowercase: true },
	username: { type: String, unique: true, required: true, index: true, lowercase: true },
	usertype: { type: String, default: 'singleuser', enum: ['singleuser', 'company', 'npo'] },
	subtype: { type: String, default: 'none', enum: ['none', 'municipality', 'hospital', 'school', 'park', 'cultural', 'civilprotection'] },
	password: { type: String, required: true, select: false },
	banned: { type: Boolean, default: false },

	premium: {
		enabled: { type: Boolean, default: false },
		start: { type: Date, default: null },
		expiration: { type: Date, default: null }
	},

	policyversion: {
		privacy: { type: Number, default: conf.policyversion.privacy },
		terms: { type: Number, default: conf.policyversion.terms }
	},

	/* Referral */
	refby: { type: String, default: null, select: false, index: true },
	refcode: { type: Number },

	/* If the user forgot the password, he can ask for a mail token for password reset */
	recovery: {
		token: { type: String, default: null },
		expiration: { type: Date, default: null }
	},

	/* The account is disabled on signup; the user can use the email token url to enable it */
	activation: {
		status: { type: Boolean, default: true },
		token: { type: String, default: null },
		reminder: { type: Date, default: null }
	},

	/* For each wrong password, the field n is incremented; n is resetted every successful login;
	 * if n >= 5, the account is locked for 5 minutes and the expiration says when the account
	 * is reenabled */
	loginlock: {
		n: { type: Number, default: 0 },
		expiration: { type: Date, default: null }
	},

	api: {
		tinklit: {
			clientId: String,
			token: String
		}
	},

	trustlevel: { type: Number, default: 1.0, min: 0.0, max: 100.0 },
	locked: { type: Boolean, default: false },
	verification: [{
		provider: { type: String, enum: ['manual', 'document', 'company', 'otc', 'residency', 'gps', 'npo', 'npostatute', 'npomemorandum', 'npoadmins'] },
		medias: [{ name: String, mid: Schema.Types.ObjectId }],

		info: { type: Schema.Types.Mixed, default: {} },
		hidden: { type: Schema.Types.Mixed, default: {}, select: false },
		step: { type: Number, default: 0 },

		submissiondate: { type: Date },
		submissionip: { type: String, default: null, select: false },

		responsedate: { type: Date, default: null },
		state: { type: String, default: 'submission', enum: ['submission', 'pending', 'inprogress', 'accepted', 'rejected'] },
		rejectreason: { type: String, default: null }
	}],

	socialauth: {
		status: { type: String, enum: ['none', 'incomplete', 'done'], default: 'none', select: false },
		accesstoken: { type: String, select: false },
		refreshtoken: { type: String, select: false },
		provider: { type: String, select: false },
		id: { type: String, select: false }
	},

	newsletter: { type: Boolean, default: false },

	lastlogin: { type: Date, default: Date.now },
	lastip: { type: String, default: null, select: false },
	regdate: { type: Date, default: Date.now },
	regip: { type: String, default: null, select: false },
	iphistory: { type: Array, select: false, default: [] },

	birthdate: { type: Date, default: null },

	country: { type: String, default: '' },
	city: { type: String, default: '' },
	street: { type: String, default: '' },
	streetnr: { type: String, default: '' },
	region: { type: String, default: '' },
	zipcode: { type: String, default: '' },
	location: { type: { type: String }, coordinates: { type: [Number] } },
	risk: {
		earthquake: {
			class: { type: String, enum: ['very-high', 'high', 'medium', 'low', 'very-low', 'norisk', 'na'], default: 'na' },
			source: { type: String, default: 'helperbit' }
		},
		flood: {
			class: { type: String, enum: ['very-high', 'high', 'medium', 'low', 'very-low', 'norisk', 'na'], default: 'na' },
			source: { type: String, default: 'helperbit' }
		},
		wildfire: {
			class: { type: String, enum: ['very-high', 'high', 'medium', 'low', 'very-low', 'norisk', 'na'], default: 'na' },
			source: { type: String, default: 'helperbit' }
		}
	},

	website: { type: String, default: '' },
	mobile: { type: String, default: '' },
	language: { type: String, default: null },
	bio: { type: types.TString, default: { en: '' } },
	avatar: { type: Schema.Types.ObjectId, default: null },

	supportedevents: [Schema.Types.ObjectId],
	donateddonations: { type: Number, default: 0 },
	donated: { type: Number, default: 0.0 },
	received: { type: Number, default: 0.0 },
	receiveddonations: { type: Number, default: 0 },
	receiveaddress: { type: String, default: '' },
	adminof: [String],
	allowdocumentssharing: { type: Boolean, defulat: false },

	/* Single User */
	gender: { type: String, enum: ['m', 'f', 'a'], default: 'a' },
	firstname: { type: String, default: '' },
	lastname: { type: String, default: '' },
	job: { type: String, default: '' },
	publicfields: [String],
	badges: [{
		code: { type: String, enum: badges },
		time: { type: Date, default: Date.now }
	}],

	/* Organizations and Company */
	fullname: { type: String, default: '' },
	countries: [{ type: String }],
	photo: { type: Schema.Types.ObjectId, default: null },

	/* Company */
	vat: { type: String, default: '' },

	/* Organizations */
	telephone: { type: String, default: '' },
	tags: [{ type: String, enum: tags }],
	operators: { type: String, enum: ['none', '2-10', '10-50', '50-250', '250-1000', '1000-5000', '5000+'], default: 'none' },
	admins: [{ type: String }],
	allowedadmins: { type: Array, select: false, default: [] },
	referent: {
		firstname: { type: String, default: '' },
		lastname: { type: String, default: '' },
		idnumber: { type: String, default: '' },
		email: { type: String, default: '' }
	},

	/* Municipality */
	inhabitants: { type: String, enum: ['none', '1-1999', '2000-4999', '5000-9999', '10000-19999', '20000-59999', '60000-249999', '+250000'], default: 'none' },
	mayor: { type: String, default: '' },
	mandateperiod: { type: Date, default: null }
});



export interface $Verification {
	provider: string;
	medias: { name: string; mid: ObjectId }[];
	info?: any;
	hidden?: any;
	step?: number;
	submissiondate: Date;
	submissionip?: string;
	responsedate?: Date;
	state: string;
	rejectreason?: string;
}

export type UserTypes = 'singleuser' | 'company' | 'npo';

export interface $UserDocument extends Document {
	email: string;
	username: string;
	usertype: UserTypes;
	subtype: string;
	password: string;
	banned: boolean;

	premium: {
		enabled: boolean;
		start?: Date;
		expiration?: Date;
	};

	policyversion: {
		privacy: number;
		terms: number;
	};

	refby?: string;
	refcode: number;

	recovery: {
		token?: string;
		expiration?: Date;
	};

	activation: {
		status: boolean;
		token: string;
		reminder: Date;
	};

	loginlock: {
		n: number;
		expiration?: Date;
	};

	api: {
		tinklit: {
			clientId: string;
			token: string;
		};
	};

	trustlevel: number;
	locked: boolean;
	verification: $Verification[];

	socialauth: any;

	newsletter: boolean;
	lastlogin: Date;
	lastip: string;
	regdate: Date;
	regip: string;
	iphistory: string[];
	birthdate: Date;

	country: string;
	city: string;
	street: string;
	streetnr: string;
	region: string;
	zipcode: string;
	location: Point;
	risk: {
		earthquake: { class: string; source: string };
		flood: { class: string; source: string };
		wildfire: { class: string; source: string };
	};

	website: string;
	mobile: string;
	language: string;
	bio: $TString;
	avatar: ObjectId | null;

	supportedevents: ObjectId[];
	donateddonations: number;
	donated: number;
	received: number;
	receiveddonations: number;
	receiveaddress: string;

	adminof: string[];
	allowdocumentssharing: boolean;

	/* Singleuser */
	gender: string;
	firstname: string;
	lastname: string;
	job: string;
	publicfields: string[];
	badges: { code: string; time: Date }[];

	/* Organization and company */
	fullname: string;
	countries: string[];
	photo: ObjectId | null;

	/* Company */
	vat: string;

	/* Organizations */
	telephone: string;
	tags: string[];
	operators: number;
	admins: string[];
	allowedadmins: string[];
	referent: {
		firstname: string;
		lastname: string;
		idnumber: string;
		email: string;
	};

	/* Municipality */
	inhabitants: string;
	mayor: string;
	mandateperiod: Date;

	updateTrust(): void;
	safeUpdate(any): void;
	getVerificationIndex(string): number;
	getVerification(string): $Verification | null;
	removeVerification(string): boolean;
	updateVerification($Verification): boolean;
	addBadge(string): boolean;
	format(boolean): any;
	isAnOrganization(): boolean;
	isBanned(): boolean;
	verifyPassword(password: string): boolean;
}


// UserSchema.index ({ location: '2dsphere' });

const OrganizationTypes = ['npo'];
// const AvailableTypes = ['singleuser', 'npo', 'company'];
const LockedFields = ['country', 'birthdate', 'city', 'zipcode', 'street', 'streetnr', 'region', 'location',
	'fullname', 'firstname', 'lastname', 'countries', 'vat', 'inhabitants', 'mayor', 'mandateperiod', 'tags',
	'referent'];

// var MandatoryVATCountries = ['ITA', 'AUS'];

/* Public fields */
const PublicFields = {
	common: ['bio', 'avatar', 'language', 'mobile', 'website', 'newsletter', 'country',
		'birthdate', 'city', 'zipcode', 'street', 'streetnr', 'region', 'location', 'risk'],
	singleuser: ['publicfields', 'gender', 'firstname', 'lastname', 'job', 'badges'],
	company: ['vat', 'fullname', 'telephone', 'vat', 'photo', 'countries'],
	organization: ['vat', 'subtype', 'fullname', 'countries', 'telephone', 'photo'],
	organizationsubtype: {
		municipality: ['inhabitants', 'mayor', 'mandateperiod'],
		none: ['tags', 'operators', 'vat']
	}
};

/* Private fields */
const PrivateFields = {
	common: ['email', 'adminof', 'admins', 'policyversion', 'premium'],
	singleuser: [],
	organization: ['referent', 'allowdocumentssharing'],
	organizationsubtype: {
		municipality: []
	},
	company: []
};

/* Updatable fields */
const EditableFields = {
	common: ['bio', 'language', 'mobile', 'website', 'newsletter', 'country',
		'birthdate', 'city', 'zipcode', 'street', 'streetnr', 'region', 'location',
		'policyversion'],
	singleuser: ['publicfields', 'gender', 'firstname', 'lastname', 'job'],
	organization: ['fullname', 'countries', 'telephone', 'referent', 'allowdocumentssharing'],
	organizationsubtype: {
		municipality: ['inhabitants', 'mayor', 'mandateperiod'],
		none: ['tags', 'operators', 'vat']
	},
	company: ['fullname', 'telephone', 'vat', 'countries']
};

const fieldsFor = function (fields, usertype, subtype) {
	if (usertype === null)
		return fields.common;
	else if (usertype == 'singleuser')
		return fields.common.concat(fields.singleuser);
	else if (usertype == 'company')
		return fields.common.concat(fields.company);
	else {
		let f = fields.common;

		if (subtype in fields.organizationsubtype)
			f = f.concat(fields.organizationsubtype[subtype]);

		return f.concat(fields.organization);
	}
};

const editableFieldsForType = function (usertype, subtype) { return fieldsFor(EditableFields, usertype, subtype); };
const publicFieldsForType = function (usertype, subtype) { return fieldsFor(PublicFields, usertype, subtype); };
const privateFieldsForType = function (usertype, subtype) { return fieldsFor(PrivateFields, usertype, subtype); };


/* Password update */
UserSchema.pre('save', function (callback) {
	const user = this as $UserDocument;

	/* Check user type */
	// TODO: Questa riga e' stata triggerata senza alcun motivo per seed_madagascar
	// if (AvailableTypes.indexOf(user.usertype) == -1)
	// 	user.usertype = 'singleuser';

	/* Hot fix for invalid date */
	if (user.birthdate) {
		const m = moment(user.birthdate);
		if (m.hours() != 0) 
			user.birthdate = m.hours(0).add(1, 'days').toDate();
	}

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


UserSchema.methods.mandatoryFields = function () {
	const mandatoryFields = [];
	const user = this;

	// Single user
	if (user.usertype == 'singleuser') {
		mandatoryFields.push('firstname');
		mandatoryFields.push('lastname');
		mandatoryFields.push('gender');
		mandatoryFields.push('birthdate');
	}
	// Municipality 
	else if (user.usertype == 'npo' && user.subtype == 'municipality') {
		mandatoryFields.push('fullname');
		mandatoryFields.push('website');
		mandatoryFields.push('mayor');
		mandatoryFields.push('inhabitants');
		mandatoryFields.push('mandateperiod');
	}
	// Other npos, company
	else {
		mandatoryFields.push('fullname');
		mandatoryFields.push('countries');
		mandatoryFields.push('website');
		mandatoryFields.push('birthdate');
		if (user.usertype == 'npo') {
			mandatoryFields.push('operators');
			mandatoryFields.push('tags');
		}

		mandatoryFields.push('vat');

		// NPO: Referent fields 
		if (user.usertype === 'npo') {
			mandatoryFields.push('referent.firstname');
			mandatoryFields.push('referent.lastname');
			mandatoryFields.push('referent.email');
			mandatoryFields.push('referent.idnumber');
		}
	}

	// Common fields
	mandatoryFields.push('city');
	mandatoryFields.push('country');
	mandatoryFields.push('street');
	mandatoryFields.push('streetnr');
	mandatoryFields.push('zipcode');
	mandatoryFields.push('location');

	return mandatoryFields;
};


UserSchema.methods.incompleteFields = function () {
	const incompleteFields = [];
	const user = this;

	// Single user
	if (user.usertype == 'singleuser') {
		if (user.firstname === null || user.firstname === '')
			incompleteFields.push('firstname');
		if (user.lastname === null || user.lastname === '')
			incompleteFields.push('lastname');
		if (user.gender === 'a')
			incompleteFields.push('gender');
		if (user.birthdate === null || user.birthdate === '' || new Date(user.birthdate).getTime() == 0)
			incompleteFields.push('birthdate');
	}
	// Municipality 
	else if (user.usertype == 'npo' && user.subtype == 'municipality') {
		if (user.fullname === null || user.fullname === '')
			incompleteFields.push('fullname');
		if (user.website === null || user.website.length === 0)
			incompleteFields.push('website');
		if (user.mayor === null || user.mayor.length === 0)
			incompleteFields.push('mayor');
		if (user.inhabitants == 'none')
			incompleteFields.push('inhabitants');
		if (user.mandateperiod === null || user.mandateperiod === '' || new Date(user.mandateperiod).getTime() == 0)
			incompleteFields.push('mandateperiod');
	}
	// Other npos, company
	else {
		if (user.fullname === null || user.fullname === '')
			incompleteFields.push('fullname');
		if (user.countries.length === 0)
			incompleteFields.push('countries');
		if (user.website === null || user.website.length === 0)
			incompleteFields.push('website');
		if (user.operators == 'none' && user.usertype == 'npo')
			incompleteFields.push('operators');
		if (user.birthdate === null || user.birthdate === '' || new Date(user.birthdate).getTime() == 0)
			incompleteFields.push('birthdate');
		if (user.usertype === 'npo' && user.subtype === 'none' && user.tags.length === 0 && user.username != 'helperbit')
			incompleteFields.push('tags');
		if (user.vat === null || user.vat.length === 0)
			incompleteFields.push('vat');

		/* if ((user.usertype === 'npo' && MandatoryVATCountries.indexOf(user.country) != -1) || user.usertype !== 'npo') {
			if (user.vat === null || user.vat.length === 0)
				incompleteFields.push('vat');
		}*/

		// NPO: Referent fields 
		if (user.usertype === 'npo') {
			if (user.referent.firstname === '')
				incompleteFields.push('referent.firstname');
			if (user.referent.lastname === '')
				incompleteFields.push('referent.lastname');
			if (user.referent.email === '')
				incompleteFields.push('referent.email');
			if (user.referent.idnumber === '')
				incompleteFields.push('referent.idnumber');
		}
	}

	// Common fields
	if (user.city === null || user.city === '')
		incompleteFields.push('city');
	if (user.country === null || user.country === '')
		incompleteFields.push('country');
	if (user.street === null || user.street === '')
		incompleteFields.push('street');
	if (user.streetnr === null || user.streetnr === '')
		incompleteFields.push('streetnr');
	if (user.zipcode === null || user.zipcode === '')
		incompleteFields.push('zipcode');
	if (user.location.coordinates.length != 2)
		incompleteFields.push('location');

	return incompleteFields;
};

/* Check inserted password */
UserSchema.methods.verifyPassword = function (password) {
	const th = this;
	return new Promise(function (resolve, reject) {
		bcrypt.compare(password, th.password, function (err, isMatch) {
			if (err) return reject(err);
			resolve(isMatch);
		});
	});
};



UserSchema.methods.updateTrust = function () {
	const user = this;
	let trust = 1.0;

	/* Email verify +2 */
	if (user.activation.status)
		trust += 2.0;

	/* Base informations +1 */
	if (user.usertype == 'singleuser' && user.firstname !== null && user.firstname !== ''
		&& user.lastname !== null && user.lastname !== '')
		trust += 1.0;

	/* Avatar +1 */
	if (user.avatar !== null)
		trust += 1.0;

	/* Donation to event +5 */
	if (user.supportedevents.length > 0)
		trust += 5.0;

	/* Address */
	if (schemaValidator.addressCheck(user.receiveaddress))
		trust += 1.0;

	/* Documents */
	if (user.verification.length > 0) {
		for (let i = 0; i < user.verification.length; i++) {
			const v = user.verification[i];

			if (!(v.provider in UserVerifyProviders)) continue;

			if (v.state == 'accepted') {
				const prov = UserVerifyProviders[v.provider]();
				user.locked = true;
				trust += prov.trustpercentage[user.usertype] || prov.trustpercentage['default'];
			}
		}
	}

	/* Geoloc */
	if (user.location && user.location.coordinates.length == 2) {
		trust += (user.usertype == 'singleuser' ? 4.0 : 5.0);
	}

	/* Boundary value */
	if (trust > 100.0)
		trust = 100.0;

	user.trustlevel = trust;
};


/* Check for locked fields update */
UserSchema.methods.checkLockViolation = function (reqbody) {
	const user = this;

	if (user.locked === false)
		return false;

	for (let i = 0; i < Object.keys(reqbody).length; i++) {
		const key = Object.keys(reqbody)[i];
		if (LockedFields.indexOf(key) != -1)
			return true;
	}
	return false;
};


/* User information update */
UserSchema.methods.safeUpdate = function (reqbody) {
	let i;
	const ufields = editableFieldsForType(this.usertype, this.subtype);

	/* Public fields sanity */
	if (this.usertype == 'singleuser' && 'publicfields' in reqbody) {
		const pf = [];

		for (i = 0; i < reqbody.publicfields.length; i++) {
			if (ufields.indexOf(reqbody.publicfields[i]) != -1 && pf.indexOf(reqbody.publicfields[i]) == -1)
				pf.push(reqbody.publicfields[i]);
		}
		reqbody.publicfields = pf;
	}

	/* Fields sanity */
	for (i = 0; i < Object.keys(reqbody).length; i++) {
		const key = Object.keys(reqbody)[i];

		if (ufields.indexOf(key) == -1)
			continue;

		if (key == 'website' && reqbody[key].length > 3)
			this[key] = ((reqbody[key].indexOf('http') == -1) ? 'https://' : '') + reqbody[key].toLowerCase();
		else if (key == 'countries' && reqbody[key].indexOf('WRL') != -1)
			this[key] = ['WRL'];
		else if ((key == 'birthdate' || key == 'mandateperiod') && (new Date(reqbody[key]).getTime() == 0))
			this[key] = null;
		else if (key == 'policyversion' && (reqbody.policyversion.terms != conf.policyversion.terms || reqbody.policyversion.privacy != conf.policyversion.privacy))
			continue
		else
			this[key] = reqbody[key];
	}

	this.updateTrust();

	return this;
};

/* Return the index of the verification, or -1 */
UserSchema.methods.getVerificationIndex = function (provider: string) {
	for (const i in this.verification) {
		if (this.verification[i].provider == provider)
			return i;
	}
	return -1;
};

UserSchema.methods.getVerification = function (provider: string) {
	const i = this.getVerificationIndex(provider);
	if (i == -1)
		return null;
	return this.verification[i];
};

UserSchema.methods.removeVerification = function (provider: string) {
	const i = this.getVerificationIndex(provider);
	if (i != -1) {
		this.verification.splice(i, 1);
		this.markModified('verification');
		this.updateTrust();

		if (this.verification.length === 0)
			this.locked = false;
	}
};

UserSchema.methods.updateVerification = function (ver: $Verification) {
	const oldi = this.getVerificationIndex(ver.provider);

	if (oldi != -1) {
		this.verification.splice(oldi, 1);
	}
	this.verification.push(ver);

	if (ver.state == 'accepted')
		this.locked = true;

	this.updateTrust();
};


/* Return true if it's an organization */
UserSchema.methods.isAnOrganization = function () {
	return (OrganizationTypes.indexOf(this.usertype) != -1);
};


/* Return true if it's a company */
UserSchema.methods.isACompany = function () {
	return ('company' === this.usertype);
};

/* Return true if it's banned */
UserSchema.methods.isBanned = function () {
	return this.banned;
};



/* Add a badge */
UserSchema.methods.addBadge = function (code) {
	if (this.usertype != 'singleuser')
		return false;
	if (this.badges.filter(b => b.code == code).length != 0)
		return false;
	this.badges.push({ code: code, time: new Date() });
	this.markModified('badges');
	return true;
};


/* Format an user for retrieval */
UserSchema.methods.format = function (isMe) {
	const injectFields = function (ruser, user, fields: (string | string[])[]) {
		if (fields === null) return ruser;

		fields.forEach(function (field) {
			if (typeof (field) == 'string') {
				ruser[field] = user[field];
			}
			else if (typeof (field) == 'object' && field.length == 2) {
				if (!(field[0] in ruser))
					ruser[field[0]] = {};
				ruser[field[0]][field[1]] = user[field[0]][field[1]];
			}
		});
		return ruser;
	};

	const ruser: any = {
		_id: this._id,
		username: this.username,
		regdate: this.regdate,
		supportedevents: this.supportedevents,
		donated: this.donated,
		donateddonations: this.donateddonations,
		received: this.received,
		receiveddonations: this.receiveddonations,
		avatar: this.avatar,
		country: this.country,
		receiveaddress: this.receiveaddress,
		usertype: this.usertype,
		bio: this.bio,
		trustlevel: this.trustlevel,
		locked: this.locked,
		social: this.social,
		risk: this.risk,
		refcode: this.refcode
	};

	let ufields;

	if (isMe) {
		ufields = publicFieldsForType(this.usertype, this.subtype).concat(privateFieldsForType(this.usertype, this.subtype));
		return injectFields(ruser, this, ufields);
	}
	else if (this.usertype == 'singleuser') {
		ruser['badges'] = this.badges;

		for (const x in this.publicfields) {
			if (PublicFields.singleuser.concat(PublicFields.common).indexOf(this.publicfields[x]) != -1)
				ruser[this.publicfields[x]] = this[this.publicfields[x]];
		}
		return ruser;
	}
	else {
		ufields = publicFieldsForType(this.usertype, this.subtype);
		return injectFields(ruser, this, ufields);
	}
};


export const User: Model<$UserDocument> = model<$UserDocument>('User', UserSchema);

export class UserModel extends ModelOfDocument<$UserDocument> {
	/* Returns last obtained badges sorted desc */
	static lastBadges(limit: number) {
		return User.aggregate()
			.match({ banned: false })
			.unwind('badges')
			.project({
				code: '$badges.code',
				time: '$badges.time',
				user: '$username'
			})
			.sort({ 'time': 'desc' })
			.limit(limit)
			.exec();
	}

	static listReferred(refby, selector?: string) {
		return User.find({ refby: refby }, selector).exec();
	}

	static countReferred(refby) {
		return User.countDocuments({ refby: refby }).exec();
	}

	static async listVerifiedReferred(refby, selector?: string) {
		return User.find({ refby: refby, trustlevel: { $gte: UserModel.constants.minVerifedReferralTrust } }, selector).exec();
	}

	static async countVerifiedReferred(refby) {
		return User.countDocuments({ refby: refby, trustlevel: { $gte: UserModel.constants.minVerifedReferralTrust } }).exec();
	}

	static ambassadorRanks(params?: { limit?: number; unverified?: boolean; timeframe?: string }) {
		if (!params)
			params = {};

		let q = User.aggregate()

		if (params.unverified) {
			const query: any = QueryHelper.copyQuery(UserModel.queries.referredUsers);
			const frame = QueryHelper.timeframe(params.timeframe || "");

			if (frame)
				query.regdate = { $gte: new Date(frame.format()) };

			q = q.match(query)
				.project({
					ver: UserModel.queries.referralVerifiedCond,
					refby: '$refby'
				})
				.group({
					_id: '$refby',
					count: { $sum: 1 },
					countver: { $sum: '$ver' }
				})
				.sort({ countver: 'desc' });
		} else {
			const query: any = QueryHelper.copyQuery(UserModel.queries.referredVerifiedUsers);
			const frame = QueryHelper.timeframe(params.timeframe || "");

			if (frame)
				query.regdate = { $gte: new Date(frame.format()) };

			q = q.match(query)
				.group({
					_id: '$refby',
					count: { $sum: 1 }
				})
				.sort({ n: 'desc' });
		}

		if (params.limit)
			q = q.limit(params.limit);

		return q.exec();
	}

	static getByUsernameOrEmail(email, selector?: string) {
		return User.findOne({ $or: [{ email: email }, { username: email }] }, selector).exec();
	}

	static async getByReferral(username, selected?: string) {
		try {
			return await User.findOne({ refcode: username }, selected).exec();
		} catch (err) {
			try {
				return await User.findOne({ $or: [{ username: username }, { _id: Types.ObjectId(username) }] }, selected).exec();
			} catch (err) {
				return await User.findOne({ username: username }, selected).exec();
			}
		}
	}

	static async getLastRefCode() {
		const usr = await User.find({}, 'refcode').sort({ regdate: 'desc' }).limit(1).exec();
		if (usr.length > 0)
			return usr[0].refcode;
		else
			return 1;
	}

	static usersByIP(ip: string | string[], selector?: string) {
		if (typeof (ip) == 'string')
			return User.find({ iphistory: ip }, selector || 'username usertype regdate').exec();
		else {
			return User.find({
				iphistory: {
					"$elemMatch": {
						$in: ip
					}
				}
			}, selector || 'username usertype regdate').exec();
		}
	}

	static getByUsername(username, selector?: string) {
		return User.findOne({ username: username }, selector).exec();
	}

	static getByEmail(email, selector?: string) {
		return User.findOne({ email: email }, selector).exec();
	}

	static constants = {
		minVerifedReferralTrust: 33
	}

	static queries = {
		referralVerifiedCond: {
			$cond: [
				{
					$and: [
						{ $gte: ['$trustlevel', UserModel.constants.minVerifedReferralTrust] },
						{ banned: false }
					]
				},
				1, 0]
		},
		referredVerifiedUsers: { banned: false, 'activation.status': true, refby: { $ne: null }, trustlevel: { $gte: UserModel.constants.minVerifedReferralTrust } },
		referredUsers: { banned: false, 'activation.status': true, refby: { $ne: null } },
		visualizableOrganizations: (name?: string) => {
			const fquery: { usertype: any; trustlevel: any; banned: boolean; $or?: any } = {
				usertype: { $nin: ['singleuser', 'company'] },
				trustlevel: { $gt: 50 },
				banned: false
			};

			if (name && name.length > 0)
				fquery.$or = [{ username: new RegExp(name, "i") }, { fullname: new RegExp(name, "i") }];

			return fquery;
		}
	}
}

