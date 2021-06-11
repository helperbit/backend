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

import UserBannedMetric from "./metrics/UserBanned";
import UserRegistrationMetric from "./metrics/UserRegistration";
import UserRegistrationCompanyMetric from "./metrics/UserRegistrationCompany";
import UserRegistrationOrganizationMetric from "./metrics/UserRegistrationOrganization";
import UserRegistrationNoReferralMetric from "./metrics/UserRegistrationNoReferral";
import UserRegistrationReferralMetric from "./metrics/UserRegistrationReferral";
import UserRegistrationSingleMetric from "./metrics/UserRegistrationSingle";
import UserRegistrationMunicipalityMetric from "./metrics/UserRegistrationMunicipality";
import { Module } from "../module";
import { UserModule } from "../user";
import { UserAuthApi } from "./auth.api";
import { checkAccountsNotActivated } from "./auth.jobs";

export const UserAuthModule: Module = {
	name: 'user.auth',
	require: [UserModule],
	enabled: true,

	metrics: [
		new UserBannedMetric,
		new UserRegistrationMetric,
		new UserRegistrationSingleMetric,
		new UserRegistrationCompanyMetric,
		new UserRegistrationMunicipalityMetric,
		new UserRegistrationOrganizationMetric,
		new UserRegistrationNoReferralMetric,
		new UserRegistrationReferralMetric
	],

	api: () => UserAuthApi,
	jobs: [
		{ job: checkAccountsNotActivated, timeout: 396000 }
	]
};
