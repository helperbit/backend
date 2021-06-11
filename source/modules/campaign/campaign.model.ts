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
import { $ChangeHistory } from "../../helpers/types";
import ModelOfDocument from "../model_of_document";
import conf = require('../../conf');


const CampaignSchema = new Schema({
	owner: { type: String },
	creationtime: { type: Date, default: Date.now },
	start: { type: Date, default: null },
	end: { type: Date, default: null },
	status: { type: String, enum: ['started', 'concluded'], default: 'started' },

	title: { type: String, required: true },
	description: { type: String, required: true },
	target: { type: Number, default: 0.0, required: true },
	currency: { type: String, enum: conf.currency.supported, default: 'EUR', required: true },
	media: { type: Schema.Types.ObjectId, default: null },

	received: { type: Number, default: 0.0 },
	receivedconverted: { type: Number, default: 0.0 },
	receiveddonations: { type: Number, default: 0 },
	percentage: { type: Number, default: 0 },

	type: { type: String, enum: ['project', 'user'], default: 'project' },
	resource: { type: Schema.Types.ObjectId, default: null },

	changeHistory: [
		{
			changeDate: { type: Date, default: Date.now },
			content: { type: Schema.Types.Mixed, default: {} }
		}
	]
});


CampaignSchema.virtual('ownerdetails', {
	ref: 'User',
	localField: 'owner',
	foreignField: 'username',
	justOne: true
});

const autoPopulate = function (next) {
	this.populate('ownerdetails', 'fullname usertype');
	return next();
};

CampaignSchema.pre('findOne', autoPopulate).pre('find', autoPopulate);



export interface $CampaignDocument extends Document {
	owner: string;
	creationtime: Date;
	start: Date;
	end: Date;
	status: 'started' | 'concluded';
	title: string;
	description: string;
	target: number;
	currency: string;
	media: ObjectId | null;
	received: number;
	receivedconverted: number;
	receiveddonations: number;
	percentage: number;
	type: 'project' | 'user';
	resource: ObjectId;
	changeHistory: $ChangeHistory;

	checkCompletness(): boolean;
	updatePercentage(): $CampaignDocument;
	safeUpdate(body: any, fields?: string[]): $CampaignDocument;
}



const editableFields = ['title', 'description', 'currency', 'target', 'resource', 'end']; // 'type', 
const startedEditableFields = ['title', 'description'];

/* Campaign information update */
CampaignSchema.methods.safeUpdate = function (reqbody, fields) {
	if (fields === undefined)
		fields = editableFields;
	else if (this.status == 'started')
		fields = startedEditableFields;
	else if (this.status == 'concluded')
		return this;

	for (let i = 0; i < Object.keys(reqbody).length; i++) {
		const key = Object.keys(reqbody)[i];

		if (fields.indexOf(key) != -1) {
			this[key] = reqbody[key];
		}
	}

	return this;
};

CampaignSchema.methods.checkCompletness = function () {
	if (this.title.length > 4 && this.description.length > 8 && this.target > 0 && this.resource != null)
		return true;
	return false;
};

CampaignSchema.methods.updatePercentage = function () {
	this.percentage = 100 * this.receivedconverted / this.target;
	if (this.percentage > 100)
		this.status = 'concluded';
	return this;
};

CampaignSchema.statics.listByOwner = function (owner: string, selector?: string) {
	return this.find({ owner: owner }, selector).exec();
};



export const Campaign: Model<$CampaignDocument> =
	model<$CampaignDocument>('Campaign', CampaignSchema);


export class CampaignModel extends ModelOfDocument<$CampaignDocument> {
	static getByID(id: string | ObjectId, selector?: string) {
		return Campaign.findById(id, selector).exec();
	}
}
