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

import { Response } from "express";
import { UserModel } from "../../user/user.model";
import error = require('../../../error');
import { NpoAdminsVerificationProvider } from "./npo/admins";
import { NpoStatuteVerificationProvider } from "./npo/statute";
import { NpoMemorandumVerificationProvider } from "./npo/memorandum";
import { DocumentVerificationProvider } from "./document";
import { OTCVerificationProvider } from "./otc";
import { ResidencyVerificationProvider } from "./residency";
import { GPSVerificationProvider } from "./gps";
import { CompanyVerificationProvider } from "./company";
import { NpoVerificationProvider } from "./npo";
import { UserVerificationProvider } from "./userverificationprovider";
import { ManualVerificationProvider } from "./manual";
import mediaController = require('../../media/media.controller');
import telegramHelper = require('../../../helpers/telegram');


const verifyProviders: { [key: string]: UserVerificationProvider } = {
	npoadmins: new NpoAdminsVerificationProvider,
	npostatute: new NpoStatuteVerificationProvider,
	npomemorandum: new NpoMemorandumVerificationProvider,
	document: new DocumentVerificationProvider,
	otc: new OTCVerificationProvider,
	residency: new ResidencyVerificationProvider,
	gps: new GPSVerificationProvider,
	company: new CompanyVerificationProvider,
	npo: new NpoVerificationProvider,
	manual: new ManualVerificationProvider
};

/* GET api/me/verify */
export async function getVerify(req: any, res: Response) {
	req.user.updateTrust();

	const incompleteFields = req.user.incompleteFields();
	const mandatoryFields = req.user.mandatoryFields();
	if (incompleteFields.length > 0)
		return error.response(res, 'EV1', { mandatoryfields: mandatoryFields, fields: incompleteFields });

	/* Create the available list */
	let available = Object.keys(verifyProviders);
	available = available.filter(v => verifyProviders[v].usertypes.indexOf(req.user.usertype) != -1);
	available = available.filter(v => v != 'npo');

	available = available.filter(v => {
		const deps = verifyProviders[v].dependencies;
		if (deps.length === 0)
			return true;

		for (let i = 0; i < deps.length; i++) {
			if (verifyProviders[deps[i]].usertypes.indexOf(req.user.usertype) == -1)
				continue;

			if (req.user.verification.filter(f => f.provider === deps[i] && f.state === 'accepted').length === 0) {
				return false;
			}
		}
		return true;
	});
	available = available.filter(v => !(req.user.verification.filter(vv => v == vv.provider && (vv.state === 'accepted' || vv.state === 'rejected')).length === 1));

	/* Hide new npo verifications if old are present */
	if (req.user.verification.filter(v => v.provider == 'npo').length == 1) {
		available = available.filter(v => v != 'npoadmins' && v != 'npomemorandum' && v != 'npostatute');
	}

	res.status(200);
	res.json({ mandatoryfields: mandatoryFields, available: available, verification: req.user.verification, locked: req.user.locked, trustlevel: req.user.trustlevel });
}


/* POST api/me/verify/:provider/step/:step */
export async function verifyStep(req: any, res: Response) {
	const provider = req.params.provider;
	const step = parseInt(req.params.step);

	if (!(provider in verifyProviders))
		return error.response(res, 'E');

	if (step >= verifyProviders[provider].steps) {
		return error.response(res, 'E');
	}

	if (verifyProviders[provider].usertypes.indexOf(req.user.usertype) == -1)
		return error.response(res, 'EV2');

	/* Check for incomplete fields */
	const incompleteFields = req.user.incompleteFields();
	const mandatoryFields = req.user.mandatoryFields();

	if (incompleteFields.length > 0)
		return error.response(res, 'EV1', { mandatoryfields: mandatoryFields, fields: incompleteFields });

	const user = await UserModel.getByUsername(req.user.username, '+verification.hidden');
	const ver = user.getVerification(provider);

	/* Only submission verifications can be edited */
	if (ver != null && ver.state != 'submission' && ver.state != 'inprogress')
		return error.response(res, 'E');

	return verifyProviders[provider].getStep(step)(req, res, user, ver);
}


/* POST api/me/verify/:provider/remove */
export async function removeVerification(req: any, res: Response) {
	const provider = req.params.provider;
	const user = req.user;
	const ver = user.getVerification(provider);

	if (ver == null) {
		res.status(200);
		res.json({});
	}

	if (ver.state == 'inprogress')
		return error.response(res, 'E');

	await mediaController.removeMediaList(ver.medias.map(m => { return m.mid; }));

	user.removeVerification(provider);
	user.save();

	res.status(200);
	res.json({});

	telegramHelper.notify(`Verification '${provider}' removed by ${user.username} (${user.usertype})`);
}

