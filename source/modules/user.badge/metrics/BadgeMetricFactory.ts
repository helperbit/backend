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

import { User } from "../../user/user.model";
import { BackofficeMetric } from "../../module";
import { QueryHelper } from "../../../helpers/query";

export default class BadgeCountMetric implements BackofficeMetric {
	code = null;
	ui = null;

	constructor(private badge: string) {
		this.code = "badge-count-" + badge;
		this.ui = {
			name: `${badge} badge`,
			description: `Count number of users with the badge "${badge}"`,
			icon: 'fa-gamepad',
			enabled: false,
			category: 'Badge'
		};
	}

	async total(): Promise<number>{
		return await User.countDocuments({ 'badges.code': this.badge }).exec();
	}

	async chart(timeframe: 'day' | 'week' | 'month' | 'year', start: Date, end: Date) {
		return await QueryHelper.chart(User, {
			query: { 'badges.code': this.badge },
			start: start,
			end: end,
			timeframe: timeframe,
			unwind: 'badges',
			field: 'badges.time'
		});
	}
}
