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
import { $TString, $ChangeHistory } from "../../helpers/types";
import { ObjectId } from "bson";
import ModelOfDocument from "../model_of_document";

import types = require('../../helpers/types');
import conf = require('../../conf');
const tags = require('../../data/tags.json');


const ProjectSchema = new Schema({
	owner: { type: String, required: true },
	status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
	paused: { type: Boolean, default: false },

	title: { type: types.TString, required: true },
	description: { type: types.TString, required: true },
	tags: [{ type: String, enum: tags, default: [] }],

	video: String,
	media: [Schema.Types.ObjectId],

	activities: [{
		title: { type: types.TString },
		description: { type: types.TString },
		target: { type: Number, default: 0.0 },
		createdAt: { type: Date, default: Date.now },
		category: { type: String, enum: ['update', 'invoice', 'media', 'quote'], default: 'update' },
		media: [ Schema.Types.ObjectId ]
	}],

	countries: [String],
	event: { type: Schema.Types.ObjectId },

	start: { type: Date, default: Date.now },
	end: { type: Date, default: null },

	target: { type: Number, default: 0.0, required: true },
	currency: { type: String, enum: conf.currency.supported, default: 'EUR', required: true },

	received: { type: Number, default: 0.0 },
	receiveddonations: { type: Number, default: 0 },

	pending: { type: Number, default: 0.0 },
	used: { type: Number, default: 0.0 },

	receiveaddress: { type: String, default: null },

	changeHistory: [
		{
			changeDate: { type: Date, default: Date.now },
			content: { type: Schema.Types.Mixed, default: {} }
		}
	],

	supporters: [
		{
			user: String,
			link: String,
			level: Number
		}
	]
}, { toObject: { virtuals: true }, toJSON: { virtuals: true } });

ProjectSchema.virtual('ownerdetails', {
	ref: 'User',
	localField: 'owner',
	foreignField: 'username',
	justOne: true
});

const autoPopulate = function (next) {
	this.populate('ownerdetails', 'fullname');
	return next();
};

ProjectSchema.pre('findOne', autoPopulate).pre('find', autoPopulate);


export interface $Activity {
	title: $TString;
	target: number;
	media: string[];
	createdAt: Date;
	category: 'update' | 'invoice' | 'media' | 'quote';
}

export interface $ProjectSupporter {
	user: string;
	link: string;
	level: number;
}


export interface $ProjectDocument extends Document {
	status: string;
	paused: boolean;
	owner: string;
	title: $TString;
	description: $TString;
	tags: string[];
	video: string;
	media: ObjectId[];
	activities: $Activity[];
	countries: string[];
	event: ObjectId | null;
	start: Date;
	end: Date;
	target: number;
	currency: string;
	received: number;
	pending: number;
	used: number;
	receiveddonations: number;
	receiveaddress: string;
	changeHistory: $ChangeHistory;
	supporters: $ProjectSupporter[];
};

export interface $ProjectModel extends $ProjectDocument {
	getByID(string, selector?: string): Promise<$ProjectDocument>;
};

const editableFields = ['title', 'description', 'tags', 'currency', 'countries', 'event', 'start', 'target', 'video', 'paused'];


/* Project information update */
ProjectSchema.methods.safeUpdate = function (reqbody, fields) {
	if (fields === undefined)
		fields = editableFields;

	for (let i = 0; i < Object.keys(reqbody).length; i++) {
		const key = Object.keys(reqbody)[i];

		if (fields.indexOf(key) != -1) {
			this[key] = reqbody[key];
		}
	}

	/* TODO: check for fiat
		Target reached, closed project */
	/* if ('target' in reqbody && this.end === null && reqbody.target <= this.received) {
		this.end = Date.now ();
	}

	if ('target' in reqbody && this.end !== null && reqbody.target > this.received) {
		this.end = null;
	}*/

	return this;
};



export const Project: Model<$ProjectDocument> =
	model<$ProjectDocument>('Project', ProjectSchema);



export class ProjectModel extends ModelOfDocument<$ProjectDocument> {
	static getByID(id: string, selector?: string) {
		return Project.findById(id, selector).exec();
	}
}
