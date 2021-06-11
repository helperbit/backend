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
import { Conversion } from "../../../helpers/bitcoin";

const query: { status: InvoiceStatus } = { status: 'paid' };

export default class LightningInvoiceVolumeMetric implements BackofficeMetric {
	code = "lightning-invoice-volume";
	ui = {
		name: "Lightning Invoice Volume (Paid)",
		description: "Lightning invoice paid volume",
		icon: 'fa-flash',
		enabled: false,
		category: 'Lightning'
	};

	async total() {
		const res = await LightningInvoice.aggregate().match(query).group({ _id: 1, msatoshi: { $sum: "$msatoshi" } }).exec();
		if (res.length > 0)
			return Conversion.toBitcoin(res[0]['msatoshi'] / 1000);
		return 0;
	}

	async chart(timeframe: 'day' | 'week' | 'month' | 'year', start: Date, end: Date): Promise<QueryHelper.ChartData> {
		return await QueryHelper.chart(LightningInvoice, {
			query: query,
			start: start,
			end: end,
			timeframe: timeframe,
			aggregator: { $sum: "$msatoshi" },
			field: 'created_at',
			modificator: QueryHelper.chartModificators.msat2btc
		});
	}
}
