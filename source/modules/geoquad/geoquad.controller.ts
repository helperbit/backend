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
import { GeoQuad } from "./geoquad.model";

export function getEventAffectedUserGeoQuads (affectedusers: string[]): Promise<any> {
	return new Promise((resolve, reject) => {
		const geoquad = { count: 0, min: 0, max: 0, features: [] };

		GeoQuad.aggregate()
			.match({ category: 'users.singleusers' })
			.unwind('features')
			.match({ 'features.properties.idlist': { $in: affectedusers } })
			.exec()
			.then((quads: { features: { properties: { idlist: any[] } } }[]) => {
				if (quads.length == 0)
					return resolve(geoquad);

				quads.forEach(q => {
					geoquad.features.push(q.features);
					geoquad.count += q.features.properties.idlist.length;
					if (geoquad.min > q.features.properties.idlist.length)
						geoquad.min = q.features.properties.idlist.length;
					if (geoquad.max < q.features.properties.idlist.length)
						geoquad.max = q.features.properties.idlist.length;
				});

				resolve(geoquad);
			}).catch(err => {
				return resolve(geoquad);
			});
	});
};

export async function getSingleuserGeoQuads(req: Request, res: Response) {
	let geoquad: any = await GeoQuad.findOne({ category: 'users.singleusers' }, 'count min max features').exec();
	if (geoquad === null)
		geoquad = { count: 0, min: 0, max: 0, features: [] };

	res.status(200);
	res.json(geoquad);
};


export async function getUserGeoQuads(req: Request, res: Response) {
	let geoquad: any = await GeoQuad.findOne({ category: 'users' }, 'count min max features').exec();
	if (geoquad === null)
		geoquad = { count: 0, min: 0, max: 0, features: [] };

	res.status(200);
	res.json(geoquad);
};
