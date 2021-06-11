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

// mongoose.Promise = global.Promise;

const LightningCharityPotRoundSchema = new Schema({
	status: { type: String, enum: ['running', 'concluded'], default: 'running' },
	start: { type: Date, default: Date.now },
	expiration: { type: Date },
	value: { type: Number, default: 0 },
	votes: { type: Number, default: 0 },
	results: [
		{ 
			project: { type: Schema.Types.ObjectId, ref: 'Project' }, 
			votes: { type: Number, default: 0 },
			value: { type: Number, default: 0 }
		}
	],    
	winner: {
		project: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
		donation: { type: String, default: null },
		status: { type: String, enum: ['none', 'pending', 'done'], default: 'none' }
	}
});



export interface $LightningCharityPotRoundDocument extends Document {
	status: 'running' | 'concluded';
	start: Date;
	expiration: Date;
	value: number;
	votes: number;
	results: {
		project: ObjectId;
		votes: number;
		value: number;
	}[];
	winner: {
		project?: ObjectId;
		donation?: string;
		status: 'none' | 'pending' | 'done';
	};
}

export interface $LightningCharityPotRoundModel extends $LightningCharityPotRoundDocument {}


export const LightningCharityPotRound: Model<$LightningCharityPotRoundModel> =
	model<$LightningCharityPotRoundModel>('LightningCharityPotRound', LightningCharityPotRoundSchema);
