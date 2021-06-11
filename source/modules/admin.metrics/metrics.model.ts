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
// mongoose.Promise = global.Promise;

const AdminMetricsSchema = new Schema({
	time: { type: String, unique: true },
	date: { type: Date },
	social: {
		facebook: { type: Number, default: 0 },
		twitter: { type: Number, default: 0 },
		linkedin: { type: Number, default: 0 },
		instagram: { type: Number, default: 0 },
		googleplus: { type: Number, default: 0 }
	},
	newspaper_articles: { type: Number, default: 0 },
	physical_events: { type: Number, default: 0 },
	wallet_balances: { type: Number, default: 0 },
	wallet_secured_balances: { type: Number, default: 0 },
	trustlevel_average: { type: Number, default: 0 },

	profit: { type: Number, default: 0 },
	burn_rate: { type: Number, default: 0 },
	fee_revenue: { type: Number, default: 0 },
	consultancy_revenue: { type: Number, default: 0 },

	therocktrading: {
		reward: { type: Number, default: 0 },
		affiliates: { type: Number, default: 0 }
	},
	analytics: {
		users: { type: Number, default: 0 },
		newusers: { type: Number, default: 0 },
		sessions: { type: Number, default: 0 },
		pageviews: { type: Number, default: 0 }
	}
});


export interface $AdminMetricsDocument extends Document {
	time: string;
	date: Date;
	social: {
		facebook: number;
		twitter: number;
		linkedin: number;
		instagram: number;
	};
	newspaper_articles: number;
	physical_events: number;
	wallet_balances: number;
	wallet_secured_balances: number;
	trustlevel_average: number;

	profit: number;
	burn_rate: number;
	fee_revenue: number;
	consultancy_revenue: number;

	therocktrading: {
		reward: number;
		affiliates: number;
	};
	analytics: {
		users: number;
		newusers: number;
		sessions: number;
		pageviews: number;
	};
}

export const AdminMetrics: Model<$AdminMetricsDocument> =
	model<$AdminMetricsDocument>('AdminMetrics', AdminMetricsSchema);
