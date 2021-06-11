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

import { TimeLockTransaction, $TimeLockTransactionDocument } from "./timelocktransaction.model";
import { VerifyRouter } from "./verify.api";
import { VerifyAdminRouter } from "./admin/verify";
import moment = require('moment');
import WalletVerificationSecuredBalancesMetric from "./metrics/WalletVerificationSecuredBalances";
import WalletVerificationCountMetric from './metrics/WalletVerificationCount';
import { Module, getModuleConfiguration, BackofficeDescriptor, BackofficeMetric } from "../module";
import { Router } from "express";
import { Model } from "mongoose";

export interface WalletVerifyConfig {
	enabled: boolean;
	recoveryAddress: string;
	alternativeRecoveryAddress: string;
	recoveryTimeout: { amount: number; unit: moment.unitOfTime.DurationConstructor };
	alternativeRecoveryTimeout: { amount: number; unit: moment.unitOfTime.DurationConstructor };
}

export const WalletKeyverModule: Module = {
	name: 'wallet.verify',
	enabled: true,
	require: [],
	admin: {
		subof: 'wallet',
		title: 'TimeLock Transactions',
		icon: 'fa-clock-o',
		menu: [
			{ title: 'All', url: '/admin/tltransactions/list' },
			{ title: 'Creation', url: '/admin/tltransactions/creation' },
			{ title: 'Signing', url: '/admin/tltransactions/signing' },
			{ title: 'Signed', url: '/admin/tltransactions/signed' }
		]
	},
	metrics: [
		new WalletVerificationCountMetric,
		new WalletVerificationSecuredBalancesMetric
	],
	api(): Router { return VerifyRouter; },
	adminApi(): Router { return VerifyAdminRouter; },
	jobs: [
		// { job: checkVerifyExpirations, timeout: 900000 }
	]
};
