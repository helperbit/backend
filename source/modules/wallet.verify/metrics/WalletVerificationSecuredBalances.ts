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

import { AdminMetrics } from "../../admin.metrics/metrics.model";
import { BackofficeMetric } from "../../module";
import { QueryHelper } from "../../../helpers/query";
import { TimeLockTransaction } from "../timelocktransaction.model";

const query = { status: 'signed' };

export default class WalletVerificationSecuredBalancesMetric implements BackofficeMetric {
	code = "wallet-verification-secured-balances";
	ui = {
		name: "Wallet balances secured",
		description: "Total wallet balances secured with timelocktransactions",
		icon: 'fa-btc',
		enabled: false,
		category: 'Wallet'
	};

	async total(): Promise<number> {
		const res: { value: number }[] = await TimeLockTransaction.aggregate()
			.match(query)
			.group({ _id: "$wallet.address", value: { $last: "$value" } })
			.group({ _id: 1, value: { $sum: "$value" } })
			.exec();
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
			aggregator: { $last: '$wallet_secured_balances' },
			field: 'date'
		});
	}
}
