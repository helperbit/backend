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

import { AdminMetrics } from "../metrics.model";
import { QueryHelper } from "../../../helpers/query";
import { BackofficeMetric } from "../../module";

export default class AnalyticsSessionMetric implements BackofficeMetric {
	code = "analytics-session";
	ui = {
		name: "Analytics Session",
		description: "Analytics Session",
		icon: 'fa-google',
		enabled: false,
		category: 'Analytics'
	};

	async total(): Promise<number> {
		const res = await AdminMetrics.aggregate().match({}).group({ _id: 1, value: { $sum: "$analytics.sessions" } }).exec();
		if (res.length > 0)
			return res[0]['value'];
		return 0;
	}

	async chart(timeframe: 'day' | 'week' | 'month' | 'year', start: Date, end: Date): Promise<QueryHelper.ChartData> {
		return await QueryHelper.chart(AdminMetrics, {
			query: {},
			start: start,
			end: end,
			timeframe: timeframe,
			aggregator: { $sum: '$analytics.sessions' },
			field: 'date'
		});
	}
}

