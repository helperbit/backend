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

import { Module } from "./module";
import { WalletKeyverModule } from "./wallet.verify";
import { AdminModule } from "./admin";
import { AdminMetricsModule } from "./admin.metrics";
import { AdminLogModule } from "./admin.log";
import { AdminUserModule } from "./admin.user";
import { WalletTransactionModule } from "./wallet.transaction";
import { WalletModule } from "./wallet";
import { WalletMultisigModule } from "./wallet.multisig";
import { AdminMailToolModule } from "./admin.mailtool";
import { AdminSearchModule } from "./admin.search";
import { BlockchainModule } from "./blockchain";
import { CampaignModule } from "./campaign";
import { UserModule } from "./user";
import { DonationModule } from "./donation";
import { GeoQuadModule } from "./geoquad";
import { MiscModule } from "./misc";
import { MediaModule } from "./media";
import { RorModule } from "./ror";
import { ProposedNPOModule } from "./proposednpo";
import { UserAdminModule } from "./user.admin";
import { UserAmbassadorModule } from "./user.ambassador";
import { UserAuthModule } from "./user.auth";
import { UserBadgeModule } from "./user.badge";
import { UserVerifyModule } from "./user.verify";
import { UserAuthSocialModule } from "./user.auth.social";
import { DonationAltModule } from "./donation.alt";
import { DonationFiatModule } from "./donation.fiat";
import { StatisticsModule } from "./statistics";
import { NotificationModule } from "./notification";
import { LightningCharityPotModule } from "./lightning.charitypot";
import { LightningModule } from "./lightning";
import { ProjectModule } from "./project";
import { EventModule } from "./event";


export function MR(name: string) {
	return ModuleRepository.i().get(name);
}

export class ModuleRepository {
	modules: Module[];
	modulesDict: { [name: string]: Module };

	static _instance: ModuleRepository;

	static i(): ModuleRepository {
		if (ModuleRepository._instance)
			return ModuleRepository._instance;
		ModuleRepository._instance = new ModuleRepository();
		return ModuleRepository.i();
	}

	constructor() {
		this.modules = [
			// require('./event.alert'),
			AdminModule,
			AdminLogModule,
			AdminMailToolModule,
			AdminMetricsModule,
			AdminSearchModule,
			AdminUserModule,
			BlockchainModule,
			CampaignModule,
			DonationModule,
			DonationAltModule,
			DonationFiatModule,
			EventModule,
			GeoQuadModule,
			LightningModule,
			LightningCharityPotModule,
			MediaModule,
			MiscModule,
			NotificationModule,
			ProjectModule,
			ProposedNPOModule,
			RorModule,
			StatisticsModule,
			UserModule,
			UserAdminModule,
			UserAmbassadorModule,
			UserAuthModule,
			UserAuthSocialModule,
			UserBadgeModule,
			UserVerifyModule,
			WalletModule,
			WalletMultisigModule,
			WalletTransactionModule,
			WalletKeyverModule
		].filter(m => m.enabled);

		this.modulesDict = {};
		this.modules.forEach(m => {
			this.modulesDict[m.name] = m;
		});
	}

	get(name: string): Module {
		if (name in this.modulesDict)
			return this.modulesDict[name];

		return null;
	}

	list() {
		return this.modules;
	}
}
