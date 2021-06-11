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

import { LightningCharityPotRound } from "./round.model";
import moment = require('moment');
import log = require('../../log');
import charitypotController = require('./charitypot.controller');
import { LightningCharityPotModule, LightningCharityPotConfig } from ".";
import { getModuleConfiguration } from "../module";
import { Conversion } from "../../helpers/bitcoin";

const moduleName = 'lightning.charitypot';

export async function checkCurrentRound() {
	const moduleConfig = getModuleConfiguration(LightningCharityPotModule) as LightningCharityPotConfig;

	log.job.debug(moduleName, 'Checking current round');
	let round = await charitypotController.getCurrentRound(true);

	if (!round) {
		round = new LightningCharityPotRound();
		round.expiration = moment(round.start).add(moduleConfig.roundDuration, 'hours').toDate();
		await round.save();
		const m = `Created new round expiring in ${moduleConfig.roundDuration} hours`;
		log.job.debug(moduleName, m, { telegram: true });
	}

	// Expired, but value < minValue
	if (moment() > moment(round.expiration) && Conversion.toBitcoin(round.value / 1000) < moduleConfig.minValue) {
		const m = `Round expired but minValue not reached: increasing expiration of ${moduleConfig.expirationIncrease} hours`;
		log.job.debug(moduleName, m, { telegram: true });
		round.expiration = moment(round.expiration).add(moduleConfig.expirationIncrease, 'hours').toDate();
		await round.save();
	}
	// Expired and value reached
	else if (moment() > moment(round.expiration)) {
		round.status = 'concluded';
		round.winner = {
			project: round.results[0].project,
			donation: null,
			status: 'pending'
		};
		await round.save();
		const m = `Round concluded with a value of ${Conversion.toBitcoin(round.value / 1000)} BTC. Project ${round.winner.project} pending donation.`;
		log.job.debug(moduleName, m, { telegram: true });

		// Force creation of new round
		return checkCurrentRound();
	}
}

export async function updateCurrentRound() {
	log.job.debug(moduleName, 'Updating current round');
	await charitypotController.updateCurrentRound();
}
