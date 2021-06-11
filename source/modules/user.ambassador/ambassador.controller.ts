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
import { $AdminMerchandiseDocument, AdminMerchandise } from './merchandise.model';
import { UserModel, User } from "../user/user.model";


/* GET api/me/ambassador */
export async function ambassador(req: any, res: Response) {
	const users = (await UserModel.listReferred(req.username, 'username regdate trustlevel')).map(u => ({
		regdate: u.regdate,
		verified: u.trustlevel > 27
	}));
	const refby = (await User.findOne({ username: req.username }, '+refby').exec()).refby;

	res.status(200);
	res.json({
		count: users.filter(u => u.verified).length,
		referred: users,
		refby: refby
	});
}


/* GET api/stats/topambassadors */
export async function getTopAmbassadors(req: Request, res: Response) {
	const topambassadors = await UserModel.ambassadorRanks({ limit: 250, timeframe: req.params.timeframe });

	res.json({ topambassadors: topambassadors.map(ta => ({ user: ta._id, count: ta.count })) });
	res.status(200);
}


/* GET api/stats/merchandise */
export async function getAmbassadorMerchandise(req: any, res: Response) {
	const mdise: $AdminMerchandiseDocument[]
		= (await AdminMerchandise.find({}).sort({ minrefs: 'asc' }).lean().exec()) as $AdminMerchandiseDocument[];

	const mdiseres = [];

	mdise.forEach(mm => {
		const m: any = mm;
		m.assignment = null;
		if (req.username) {
			m.assignments = m.assignments.filter(a => a.username == req.username);
			if (m.assignments.length == 0)
				m.assignment = null;
			else
				m.assignment = {
					username: m.assignments[0].username,
					status: m.assignments[0].status,
					time: m.assignments[0].time
				};
		}
		m.assignments = undefined;
		mdiseres.push(m);
	});

	res.json({ merchandise: mdiseres });
	res.status(200);
}
