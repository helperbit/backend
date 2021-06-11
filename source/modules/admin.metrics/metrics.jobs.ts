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

import moment = require('moment');
import log = require('../../log');
import ganalHelper = require('../../helpers/ganal');
import statisticsController = require('../statistics/statistics.controller');
import { $AdminMetricsDocument, AdminMetrics } from './metrics.model';
import { User } from '../user/user.model';
import { RedisCache } from '../../helpers/cache';
import WalletVerificationSecuredBalancesMetric from '../wallet.verify/metrics/WalletVerificationSecuredBalances';

const hbCache = new RedisCache();
const moduleName = 'admin.metrics';

export async function updateDaily() {
	await statisticsController.updateSocial();

	const now = moment().format('YYYY-MM-DD').toString();

	if (await AdminMetrics.findOne({ time: now }).exec() != null)
		return;

	const today: $AdminMetricsDocument = new AdminMetrics();
	today.time = now;
	today.date = moment().toDate();

	today.wallet_balances = await hbCache.get('totalbalance');

	today.wallet_secured_balances = await (new WalletVerificationSecuredBalancesMetric()).total();
	today.trustlevel_average = Number((await User.aggregate().match({}).group({ _id: 1, value: { $avg: "$trustlevel" } }).exec())[0]['value'] * 100) / 100;

	/* Social */
	let socialtw = 0;
	let socialfb = 0;
	
	try { socialfb = await hbCache.get('social_facebook'); } catch (err) {}
	try { socialtw = await hbCache.get('social_twitter'); } catch (err) {}

	today.social = {
		twitter: socialtw,
		facebook: socialfb,
		linkedin: 0,
		instagram: 0
	};
	
	/* Analytics */
	const gresults = await ganalHelper.getTotal(moment().subtract(1, 'day'), moment());


	today.analytics = {
		users: gresults['ga:users'],
		newusers: gresults['ga:newUsers'],
		sessions: gresults['ga:sessions'],
		pageviews: gresults['ga:pageviews']
	};

	await today.save();
	log.job.debug(moduleName, `Created automatic manual entry for: ${now}`);
}
