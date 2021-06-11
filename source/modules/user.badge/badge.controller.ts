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

import { Request, Response } from "express";
import { Blockchain } from "../../blockchain";
import telegramHelper = require('../../helpers/telegram');
import notificationController = require('../notification/notification.controller');

import { $UserDocument, UserModel, User } from '../../modules/user/user.model';
import { ProposedNPO } from "../proposednpo/proposednpo.model";
import { Campaign } from "../campaign/campaign.model";

export const requiredFields = 'usertype username trustlevel email donated +refby badges banned';

export async function checker(user: $UserDocument, prices: Blockchain.Prices) {
	if (user.isBanned())
		return [];

	if (user.usertype != 'singleuser')
		return [];


	const bb = [];

	// Supporter: endorsa (metti like) a 5 NPO già proposte e proponine una
	const ne = await ProposedNPO.countDocuments({ endorsedbyusers: user.username }).exec();
	const np = await ProposedNPO.countDocuments({ reporter: user.username }).exec();

	if (ne >= 5 && np > 0)
		bb.push('supporter');


	// Friend: se l'utente si registra con refby, o se fa registrare una persona
	if (user.refby != null || (await UserModel.countReferred(user.username)) > 0)
		bb.push('friend');

	// Trust: si attiva quando l'utente si verifica
	if (user.trustlevel >= 55)
		bb.push('trust');


	// Donor: hai donato almeno 5/50/500 euro
	const dc = await Blockchain.convertCurrency(user.donated, 'BTC', 'EUR', prices);
	if (dc >= 5)
		bb.push('donor-bronze');
	if (dc >= 50)
		bb.push('donor-silver');
	if (dc >= 500)
		bb.push('donor-gold');


	// Fundraiser: hai raccolto almeno 21€ tramite campagne solidali
	const cagg: { _id: string; amount: number }[] = await Campaign.aggregate()
		.match({ owner: user.username })
		.group({
			_id: '$owner',
			amount: { $sum: "$received" }
		})
		.exec();

	if (cagg.length > 0) {
		const dc = await Blockchain.convertCurrency(cagg[0].amount, 'BTC', 'EUR', prices);
		if (dc >= 21)
			bb.push('fundraiser-bronze');
		if (dc >= 210)
			bb.push('fundraiser-silver');
		if (dc >= 2100)
			bb.push('fundraiser-gold');
	}


	// Ambassador: hai portato almeno 2/20/50 iscritti con verifica ID completata
	const rf = await UserModel.countVerifiedReferred(user.username);
	if (rf >= 2)
		bb.push('ambassador-bronze');
	if (rf >= 20)
		bb.push('ambassador-silver');
	if (rf >= 50)
		bb.push('ambassador-gold');

	return bb;
}


/* Add a badge to the user */
export async function addBadge(user: $UserDocument, badge: string) {
	if (user.isBanned())
		return;

	if (user.usertype != 'singleuser')
		return;

	if (user.badges.filter(bb => bb.code == badge).length > 0)
		return;

	user.addBadge(badge);

	telegramHelper.notify(`User ${user.username} got new badge: ${badge}`);

	await notificationController.notify({
		user: user,
		code: 'badgeAchieved',
		email: true,
		data: { badge: badge }
	});
}


/* Check if there are missing badges in the user */
export async function updateUserBadges(username: string, prices?: Blockchain.Prices) {
	const user = await User.findOne({ username: username, usertype: 'singleuser' }).select(requiredFields).exec();
	if (!user)
		return false;

	if (user.isBanned())
		return false;

	if (user.usertype != 'singleuser')
		return false;

	let modified = false;

	if (!prices)
		prices = await Blockchain.getPrices();

	const bbl = await checker(user, prices);

	for (let i = 0; i < bbl.length; i++) {
		const badge = bbl[i];

		/* Check if the user has b */
		if (user.badges.filter(bb => bb.code == badge).length > 0)
			continue;

		await addBadge(user, badge);
		modified = true;
	}

	if (modified)
		await user.save();

	return modified;
}




/* GET api/stats/lastbadges */
export async function getLastBadges(req: Request<any, any, any, { limit: number }>, res: Response) {
	res.json({ lastbadges: await UserModel.lastBadges(Number(req.query.limit) || 10) });
	res.status(200);
}
