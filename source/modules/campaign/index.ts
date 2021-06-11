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

import CampaignCountMetric from "./metrics/CampaignCount";
import { Module, getModuleConfigurationFromName } from "../module";
import { CampaignAdminApi } from "./admin/campaign";
import { CampaignApi } from "./campaign.api";
import { concludedCheck, birthdayCheck } from "./campaign.jobs";
const moduleConfig = getModuleConfigurationFromName('campaign') as CampaignConfig;


export interface CampaignConfig {
	birthdayCheckTimeout?: number;
	concludedCheckTimeout?: number;
}

export const CampaignModule: Module = {
	name: 'campaign',
	require: [],
	enabled: true,

	admin: {
		subof: 'user',
		title: 'Campaigns',
		icon: 'fa-heart',
		url: '/admin/campaigns',
	},
	metrics: [
		new CampaignCountMetric
	],

	adminApi: () => CampaignAdminApi,
	api: () => CampaignApi,
	jobs: [
		{ job: concludedCheck, timeout: moduleConfig.concludedCheckTimeout || 300000 },
		// { job: birthdayCheck, timeout: moduleConfig.birthdayCheckTimeout || 600000 }
	]
};
