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

import { User } from "../user/user.model";
import { GeoQuad } from "./geoquad.model";
import turf = require('@turf/turf');
import log = require('../../log');
import { getModuleConfiguration } from "../module";
import { GeoQuadConfig, GeoQuadModule } from "./index";

const moduleName = 'geoquad';

async function updateGeoQuadForCategory(category) {
	const moduleConfig = getModuleConfiguration(GeoQuadModule) as GeoQuadConfig;
	
	const queryBox = async (box) => {
		const data = { "type": "FeatureCollection", "features": [], "properties": {} };

		switch (category) {
			case 'users':
				try {
					const users = await User.find({
						'location.coordinates': { $ne: [] },
						'location': { $geoWithin: { $box: [[box[0], box[1]], [box[2], box[3]]] } }
					}, 'username location').exec();

					data.features = users.map(e => ({
						type: "Feature",
						geometry: e.location,
						properties: { id: e.username }
					}));
				} catch (err) { }
				return data;

			case 'users.singleusers':
				try {
					const users = await User.find({
						'usertype': 'singleuser',
						'location.coordinates': { $ne: [] },
						'location': { $geoWithin: { $box: [[box[0], box[1]], [box[2], box[3]]] } }
					}, 'username location').exec();

					data.features = users.map(e => ({
						type: "Feature",
						geometry: e.location,
						properties: { id: e.username }
					}));
				} catch (err) { }
				return data;

			default:
				return data;
		}
	};

	let polysum = [];
	const start = [-180, -80];

	while (true) {
		const bbox = [start[0], start[1], start[0] + 20, start[1] + 20];

		const collection = await queryBox(bbox);
		if (collection.features.length !== 0) {
			const grid = turf.squareGrid(bbox as any, moduleConfig.side, 'kilometers', true);

			/* Merge id of resources */
			const aggregated = turf.collect(grid, collection as any, 'id', 'idlist');

			/* Remove empty features */
			aggregated.features = aggregated.features.filter(f => (f.properties.idlist !== undefined && f.properties.idlist.length > 0));

			if (aggregated.features.length !== 0)
				polysum = polysum.concat(aggregated.features);
		}

		start[0] = start[0] + 20;
		if (start[0] == 180) {
			start[0] = -180;
			start[1] += 20;
		}

		if (start[1] >= 80)
			break;
	}


	let geoquad = await GeoQuad.findOne({ category: category }).exec();

	if (geoquad === null) {
		geoquad = new GeoQuad();
		geoquad.category = category;
	}

	geoquad.min = 1000;
	geoquad.max = 0;
	geoquad.count = 0;

	for (let i = 0; i < polysum.length; i++) {
		if (polysum[i].properties.idlist.length < geoquad.min)
			geoquad.min = polysum[i].properties.idlist.length;

		if (polysum[i].properties.idlist.length > geoquad.max)
			geoquad.max = polysum[i].properties.idlist.length;

		geoquad.count += polysum[i].properties.idlist.length;
	}

	geoquad.features = polysum;
	await geoquad.save();
	log.job.debug(moduleName, `Updated category ${category} with ${polysum.length} features`);
}


export function update () {
	const categories = ['users', 'users.singleusers'];

	categories.forEach(cat => {
		log.job.debug(moduleName, `Updating geoquad for ${cat}...`);
		updateGeoQuadForCategory(cat);
	});
}
