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

import UserNotVerifiedMetric from "./metrics/UserNotVerified";
import UserTrustAVGMetric from "./metrics/UserTrustAvg";
import UserVerifiedIDMetric from "./metrics/UserVerifiedID";
import UserVerifiedMetric from "./metrics/UserVerified";
import { NpoVerificationProvider } from "./controller/npo";
import { CompanyVerificationProvider } from "./controller/company";
import { GPSVerificationProvider } from "./controller/gps";
import { ResidencyVerificationProvider } from "./controller/residency";
import { OTCVerificationProvider } from "./controller/otc";
import { DocumentVerificationProvider } from "./controller/document";
import { NpoMemorandumVerificationProvider } from "./controller/npo/memorandum";
import { NpoStatuteVerificationProvider } from "./controller/npo/statute";
import { NpoAdminsVerificationProvider } from "./controller/npo/admins";
import { ManualVerificationProvider } from "./controller/manual";
import { Module } from "../module";
import { UserVerifyApi } from "./verify.api";

export const UserVerifyProviders = {
	npoadmins: () => new NpoAdminsVerificationProvider,
	npostatute: () => new NpoStatuteVerificationProvider,
	npomemorandum: () => new NpoMemorandumVerificationProvider,
	document: () => new DocumentVerificationProvider,
	otc: () => new OTCVerificationProvider,
	residency: () => new ResidencyVerificationProvider,
	gps: () => new GPSVerificationProvider,
	company: () => new CompanyVerificationProvider,
	npo: () => new NpoVerificationProvider,
	manual: () => new ManualVerificationProvider
};

export const UserVerifyModule: Module = {
	name: 'user.verify',
	require: [],
	enabled: true,

	metrics: [
		new UserNotVerifiedMetric,
		new UserTrustAVGMetric,
		new UserVerifiedIDMetric,
		new UserVerifiedMetric
	],

	api: () => UserVerifyApi
};
