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

import { Donation } from "../donation.model";
import { BackofficeMetric } from "../../module";
import { QueryHelper } from "../../../helpers/query";

const query = { status: 'confirmed', 'to.type': 'singleuser' };

export default class DonationSingleVolumeMetric implements BackofficeMetric {
	code = "donation-single-volume";
	ui = {
		name: "Donation Single User Volume",
		description: "Volume of donations to single users",
		icon: 'fa-bitcoin',
		enabled: false,
		category: 'Donation'
	};

	async total() {
		const res = await Donation.aggregate().unwind('to').match(query).group({ _id: 1, value: { $sum: "$to.value" } }).exec();
		if (res.length > 0)
			return Number(res[0]['value'] * 10000) / 10000;
		return 0;
	}

	async chart(timeframe: 'day' | 'week' | 'month' | 'year', start: Date, end: Date): Promise<QueryHelper.ChartData> {
		return await QueryHelper.chart(Donation, {
			query: query,
			start: start,
			end: end,
			timeframe: timeframe,
			unwind: 'to',
			aggregator: { $sum: "$to.value" },
			field: 'time'
		});
	}
}
