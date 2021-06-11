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

import { LightningInvoice, InvoiceStatus } from "../invoice.model";
import { BackofficeMetric } from "../../module";
import { QueryHelper } from "../../../helpers/query";

const query: { status: InvoiceStatus } = { status: 'paid' };

export default class LightningInvoiceCountMetric implements BackofficeMetric {
	code = "lightning-invoice-count";
	ui = {
		name: "Lightning Invoice Count (Paid)",
		description: "Lightning invoice paid number",
		icon: 'fa-flash',
		enabled: false,
		category: 'Lightning'
	};

	async total() {
		return await LightningInvoice.countDocuments(query).exec();
	}

	async chart(timeframe: 'day' | 'week' | 'month' | 'year', start: Date, end: Date): Promise<QueryHelper.ChartData> {
		return await QueryHelper.chart(LightningInvoice, {
			query: query,
			start: start,
			end: end,
			timeframe: timeframe,
			field: 'created_at'
		});
	}
}
