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

import AnalyticsNewUserMetric from "./metrics/AnalyticsNewUser";
import AnalyticsPageViewMetric from "./metrics/AnalyticsPageview";
import AnalyticsSessionMetric from "./metrics/AnalyticsSession";
import AnalyticsUserMetric from "./metrics/AnalyticsUser";
import FinancialBurnRateMetric from "./metrics/FinancialBurnRate";
import FinancialConsultancyRevenueMetric from "./metrics/FinancialConsultancyRevenue";
import FinancialProfitMetric from "./metrics/FinancialProfit";
import SocialFacebookFollowersMetric from "./metrics/SocialFacebookFollowers";
import SocialInstagramFollowersMetric from "./metrics/SocialInstagramFollowers";
import SocialTwitterFollowersMetric from "./metrics/SocialTwitterFollowers";
import SocialLinkedinFollowersMetric from "./metrics/SocialLinkedinFollowers";
import { Module } from "../module";
import { updateDaily } from "./metrics.jobs";
import { AdminMetricsApi, initMetrics } from "./admin/metrics";

export const AdminMetricsModule: Module = {
	name: 'admin.metrics',
	require: [],
	enabled: true,

	admin: {
		subof: 'admin',
		title: 'Metrics',
		icon: 'fa-line-chart',
		url: '/admin/metrics'
	},

	metrics: [
		new AnalyticsNewUserMetric,
		new AnalyticsUserMetric,
		new AnalyticsSessionMetric,
		new AnalyticsPageViewMetric,
		new FinancialBurnRateMetric,
		new FinancialConsultancyRevenueMetric,
		new FinancialProfitMetric,
		new SocialFacebookFollowersMetric,
		new SocialInstagramFollowersMetric,
		new SocialTwitterFollowersMetric,
		new SocialLinkedinFollowersMetric
	],

	adminApi() { 
		initMetrics();
		return AdminMetricsApi; 
	},
	jobs: [
		{ job: updateDaily, timeout: 1000 * 60 * 60 * 2, onStart: false }
	]
};
