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

import us = require('underscore');
import { Moment } from "moment";
import { Types } from 'mongoose';
import { ObjectId } from "bson";
import { Conversion } from './bitcoin';
const moment = require('moment-range').extendMoment(require('moment'));

export namespace QueryHelper {
	interface Pagination {
		orderby: string;
		sort: string;
		fields?: string;
		query?: any;
		unwind?: string;
		populate?: {
			field: string;
			childs: string[];
		}[];
	}

	export function paginationApply(req: any, q: any): any {
		const limit: number = parseInt(req.body.limit) || 15;
		const page: number = parseInt(req.body.page) || 0;

		if (page >= 0)
			q.skip(page * limit);
		if (limit > 0 && limit < 101)
			q.limit(limit);

		return q;
	}



	export function pagination(req: any, model: any, defaults: Pagination): Promise<any> {
		const orderby: string = req.body.orderby || defaults.orderby;
		const sort: any = req.body.sort || defaults.sort;
		const limit: number = parseInt(req.body.limit) || 15;
		const page: number = parseInt(req.body.page) || 0;
		let sortq: any = {};
		sortq[orderby] = sort;

		let q = null;

		if (defaults.unwind) {
			q = model.aggregate().unwind(defaults.unwind).sort(sortq);
		} else if (orderby == 'operators') {
			sortq = { 'operatorsn': sort };
			const project = {
				'operatorsn': { "$indexOfArray": [['none', '2-10', '10-50', '50-250', '250-1000', '1000-5000', '5000+'], "$operators"] }
			};

			if (defaults.fields) {
				defaults.fields.split(' ').forEach(f => {
					project[f] = true;
				});
			}

			q = model.aggregate()
				.match(defaults.query || {})
				.project(project)
				.sort(sortq);
		} else {
			q = model.find(defaults.query || {}, defaults.fields || '').sort(sortq);
		}

		if (defaults.populate) {
			for (let i = 0; i < defaults.populate.length; i++)
				q = q.populate({ path: defaults.populate[i].field, select: defaults.populate[i].childs.join(' ') });
		}

		if (page >= 0) q.skip(page * limit);
		if (limit > 0 && limit < 101) q.limit(limit);

		return q.exec();
	}



	export function copyQuery(q: any) {
		return JSON.parse(JSON.stringify(q));
	}



	export type ChartData = { value: number; time: Date }[];

	export function fillTimeSeries(start: Date | null, end: Date | null, timeframe: 'day' | 'week' | 'month' | 'year', data: ChartData): ChartData {
		const span = [start || data[0].time, end || data[data.length - 1].time];
		const range = moment().range(span);
		const ndata = [];
		const datamiss = Array.from(range.by(timeframe));
		data = us.map(data, function (value, key, list) {
			value.time = moment(value.time).startOf(timeframe).format();
			return value;
		});

		datamiss.forEach(function (t: Moment) {
			const f = us.findWhere(data, { time: t.format() });

			if (f === undefined) {
				ndata.push({ value: 0, time: t });
			} else {
				ndata.push(f);
			}
		});

		us.sortBy(ndata, item => item.time);

		return ndata;
	};


	type ChartModificator = (prev: number | null, curr: number, i: number) => number;

	interface ChartParams {
		timeframe: 'day' | 'week' | 'month' | 'year';
		field?: string;
		start?: Date;
		end?: Date;
		aggregator?: any;
		query: any;
		unwind?: any;
		modificator?: ChartModificator | ChartModificator[];
	}

	export const chartModificators = {
		linearize: (prev: number | null, curr: number, i: number) => curr != 0 ? (curr - (prev != null ? prev : 0)) : 0,
		cumulative: (prev: number | null, curr: number, i: number) => {
			if (prev != null) {
				return (prev + curr)
			} else {
				return curr;
			}
		},
		average: (prev: number | null, curr: number, i: number) => curr / (i + 1),
		msat2btc: (prev: number | null, curr: number, i: number) => Conversion.toBitcoin(curr / 1000),
	}


	export async function chart(model: any, params: ChartParams): Promise<ChartData> {
		const query = JSON.parse(JSON.stringify(params.query));

		if (!params.field)
			params.field = 'time';
		if (!params.aggregator)
			params.aggregator = { $sum: 1 };
		if (!params.timeframe)
			params.timeframe = 'month';

		if (!('$and' in query) && (params.start || params.end))
			query.$and = [];

		if (params.start) {
			const st = {};
			st[params.field] = { $gte: params.start };
			query.$and.push(st);
		}

		if (params.end) {
			const st = {};
			st[params.field] = { $lt: params.end };
			query.$and.push(st);
		}

		let groupid = {};
		let sort = {};

		switch (params.timeframe) {
			case 'day':
				groupid = {
					year: { $year: "$" + params.field },
					month: { $month: "$" + params.field },
					day: { $dayOfMonth: "$" + params.field }
				};
				sort = {
					"_id.year": 1,
					"_id.month": 1,
					"_id.day": 1
				};
				break;
			case 'week':
				groupid = {
					year: { $year: "$" + params.field },
					week: { $week: "$" + params.field },
				};
				sort = {
					"_id.year": 1,
					"_id.week": 1
				};
				break;
			case 'month':
				groupid = {
					year: { $year: "$" + params.field },
					month: { $month: "$" + params.field }
				};
				sort = {
					"_id.year": 1,
					"_id.month": 1
				};
				break;
			case 'year':
				groupid = {
					year: { $year: "$" + params.field }
				};
				sort = {
					"_id.year": 1
				};
				break;
		}

		const q = model.aggregate();

		if (params.unwind)
			q.unwind(params.unwind);

		const data: {
			_id: {
				year: number;
				month: number;
				day: number;
				week: number;
			};
			value: number;
		}[] = await q.match(query)
			.group({
				_id: groupid,
				value: params.aggregator,
			})
			.sort(sort)
			.exec();


		let chartData: ChartData = data.map(d => {
			let date = null;
			switch (params.timeframe) {
				case 'day':
					date = new Date(d._id.year, d._id.month - 1, d._id.day);
					break;
				case 'week':
					date = new Date(d._id.year, 0, d._id.week * 7);
					break;
				case 'month':
					date = new Date(d._id.year, d._id.month, 0);
					break;
				case 'year':
					date = new Date(d._id.year, 0, 2);
					break;
			}
			return {
				value: d.value,
				time: moment(date)
			};
		});

		/* Add missing days */
		if (params.timeframe != 'week' && params.timeframe != 'year')
			chartData = fillTimeSeries(params.start, params.end, params.timeframe, chartData);

		/* Apply modificators */
		if (params.modificator) {
			let modificators = [];
			if (typeof (params.modificator) == 'function')
				modificators = [params.modificator];
			else if (typeof (params.modificator) == 'object')
				modificators = params.modificator;

			const applyModificator = (mod, data: ChartData) => {
				const datan = [];
				for (let i = 0; i < data.length; i++) {
					const rp = { value: data[i].value, time: data[i].time };

					if (i == 0)
						rp.value = mod(null, data[i].value, i);
					else {
						rp.value = mod(data[i - 1].value, data[i].value, i);
					}
					datan.push(rp);
				}
				return datan;
			};

			for (let i = 0; i < modificators.length; i++) {
				chartData = applyModificator(modificators[i], chartData);
			}

			return chartData;
		}

		return chartData;
	}



	export function timeframe(timeframe: string) {
		switch (timeframe) {
			case 'day':
				return moment().subtract(1, 'days');

			case 'week':
				return moment().subtract(1, 'weeks');

			case 'month':
				return moment().subtract(1, 'months');

			case '3month':
				return moment().subtract(3, 'months');

			case 'year':
				return moment().subtract(1, 'years');

			case 'ever':
				return null;

			default:
				return null;
		};
	}


	export function detectChanges(document: any, trackedFields: string[], creation?: boolean): { [key: string]: any } {
		const changes = {};

		if (creation) {
			trackedFields.forEach(path => {
				changes[path] = document[path];
			});
		} else {
			const paths = document.modifiedPaths({ includeChildren: true });

			paths.forEach(path => {
				if (trackedFields.indexOf(path) == -1)
					return;

				changes[path] = document[path];
			});
		}

		if (Object.keys(changes).length == 0)
			return null;

		return changes;
	}
}


// export function o2s(id: ObjectId): string {
// 	return o2s.toString();
// }

export function s2o(id: string): ObjectId {
	return Types.ObjectId(id);
}


export function idToDate(id: ObjectId): Date {
	return new Date( parseInt(id.toHexString().substring(0,8), 16 ) * 1000 );
}
