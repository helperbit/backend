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

import { User } from "../user.model";
import { BackofficeMetric } from "../../module";
import { QueryHelper } from "../../../helpers/query";

const query = { 'usertype': 'singleuser', 'gender': 'f' };

export default class UserGenderFemaleMetric implements BackofficeMetric {
	code = "user-gender-female";
	ui = {
		name: "User Gender Female",
		description: "Single User with female geneder",
		icon: 'fa-female',
		color: '#ff92ff',
		enabled: false,
		category: 'User'
	};

	async total(): Promise<number> {
		return await User.countDocuments(query as any).exec();
	}

	async chart(timeframe: 'day' | 'week' | 'month' | 'year', start: Date, end: Date): Promise<QueryHelper.ChartData> {
		return await QueryHelper.chart(User, {
			query: query,
			start: start,
			end: end,
			timeframe: timeframe,
			field: 'regdate'
		});
	}
}
