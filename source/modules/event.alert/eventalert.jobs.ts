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

// import { Alert } from "./alert.model";
// import { Event } from "../event/event.model";
// import { User } from "../user/user.model";
// import { Async } from "../../helpers/async";

// import turf = require('@turf/turf');
// import moment = require('moment');
// import http = require('http');
// const Modules = require('..');
// import log = require('../../log');
// const eventAlertConf = Modules.conf('event.alert');

// import eventController = require('../event/event.controller');

// /* Max sockets */
// http.globalAgent.maxSockets = 36;


// // TODO should be upgraded to turf4

// /* Get a boundary, a side (km), a list of alerts and users as geojson and
//  * return a geojson where each feature is an aggregated area with and index */
// const calculateAlertIndexes = (boundary, side, alerts, users) => {
// 	const grid = turf.hexGrid(boundary, side, 'kilometers');
// 	let aggregated = turf.sum(grid, alerts, 'trustlevel', 'trustsum');

// 	aggregated.features = aggregated.features.filter(f => (f.properties.trustsum !== undefined && f.properties.trustsum > 0));

// 	/* Insert the count of total users */
// 	aggregated = turf.count(aggregated, users, 'users');

// 	/* Union of contiguous polygons taking care that if two feature merge, the user and trustlevel is the result of the sum of both;
// 		new features should have an additional field quads = number of merged quads */
// 	const merged = [];
// 	const afeatures = aggregated.features;
// 	const x = 0;

// 	/**
// 	 mg = []		->	merged polygons
// 	 af = features	->	to merge polygons
	
// 	 foreach x in af
// 		if exists a polygon y in mg that intersect x:
// 			mg.remove (y)
// 			af.remove (x)
// 			mg.append (combine (x, y))
// 		else if exists a polygon y in af that intersect x:
// 			mg.append (combine (x, y))
// 			af.remove (x)
// 			af.remove (y)
// 		else:
// 			mg.append (x)
// 			af.remove (x)
// 	*/
// 	while (afeatures.length > 0) {
// 		let m = false;

// 		// Controlla se il poligono x interseca uno dei merged; in tal caso crea un nuovo merge piu' grande,
// 		// elimina il merged precedente ed x
// 		for (let y = 0; y < merged.length; y++) {
// 			if (turf.intersect(afeatures[0], merged[y]) !== null) {
// 				// Create the new merged of y and y
// 				const npoly = turf.union(merged[y], afeatures[0]);
// 				npoly.properties.trustsum = merged[y].properties.trustsum + afeatures[0].properties.trustsum;
// 				npoly.properties.users = merged[y].properties.users + afeatures[0].properties.users;
// 				npoly.properties.quads = merged[y].properties.quads + 1;

// 				// Remove old merged
// 				merged.splice(y, 1);

// 				// Remove old single quad
// 				afeatures.splice(0, 1);

// 				// Insert the new merge
// 				merged.push(npoly);
// 				m = true;
// 			}
// 		}

// 		if (m)
// 			continue;

// 		// Controllo se poligono x interseca y, in tal caso creo un multipoligon, elimino x e y
// 		for (let y = x + 1; y < afeatures.length; y++) {
// 			if (turf.intersect(afeatures[0], afeatures[y]) !== null) {
// 				const npoly = turf.union(afeatures[0], afeatures[y]);
// 				npoly.properties.trustsum = afeatures[y].properties.trustsum + afeatures[0].properties.trustsum;
// 				npoly.properties.users = afeatures[y].properties.users + afeatures[0].properties.users;
// 				npoly.properties.quads = 2;
// 				merged.push(npoly);

// 				afeatures.splice(y, 1);
// 				afeatures.splice(0, 1);
// 				m = true;
// 				break;
// 			}
// 		}

// 		if (m) continue;

// 		// Se poligono x non interseca nessuno, lo aggiungo ai merged ed elimino x
// 		const npoly = afeatures[0];
// 		npoly.properties.quads = 1;
// 		merged.push(npoly);

// 		afeatures.splice(0, 1);
// 	}

// 	/* Check if a feature reach a threshold to create and event */
// 	aggregated.features = merged;

// 	aggregated.features = aggregated.features.filter(f => {
// 		if (f.properties.users === 0)
// 			f.properties.users = 1 + Math.floor(f.properties.trustsum);

// 		const i = (f.properties.trustsum / f.properties.users) * 10000 / Math.pow(f.properties.quads * side, 2);
// 		f.properties.index = i;
// 		return i > eventAlertConf.threshold;
// 	});

// 	return aggregated;
// };



// /*
// 	var threshold = 0.1;
// 	var boundary = [-180, -80, 180, 80 ];
// 	var side = 50;
	
// 	var alerts = { "type": "FeatureCollection", "features": [ ] };
// 	var users = { "type": "FeatureCollection", "features": [ ] };
// */

// export async function generateFakeAlerts (n: number) {
// 	const generateRandomAlert = async (base, basetype) => {
// 		const al = new Alert();
// 		al.user = 'pinco' + Math.random();
// 		al.type = basetype;
// 		al.position = { type: 'Point', coordinates: [base[0] + (Math.random() - 0.1), base[1] + (Math.random() - 0.1)] };
// 		al.weight = Math.random();
// 		await al.save();
// 	};

// 	for (let i = 0; i < n; i++)
// 		await generateRandomAlert([9.2468, 39.2308], 'wildfire');
// }


// export async function updateAlertEvents() {
// 	const analyzeByType = async (type, rawalerts) => {
// 		const alerts = { "type": "FeatureCollection", "features": [] };
// 		alerts.features = rawalerts.map(e => ({ type: "Feature", geometry: e.position, properties: { trustlevel: e.weight } }));

// 		log.job.info('event', `Analyzing alert of type: ${type} with ${rawalerts.length} alerts`);

// 		const rawusers = await User.find({ 'location.coordinates': { $ne: [] }, 'trustlevel': { $ne: 0.0 } }, 'location').exec();
// 		const users = { "type": "FeatureCollection", "features": [] };
// 		users.features = rawusers.map(e => ({ type: "Feature", geometry: e.location }));

// 		// Exec geometrical operation and get result
// 		const boundary = [-180, -80, 180, 80];
// 		const indexes = calculateAlertIndexes(
// 			boundary,
// 			eventAlertConf.gridsize[type] || eventAlertConf.gridsize['default'],
// 			alerts,
// 			users
// 		);

// 		log.job.info('event', `Alert indexes created for ${type}`);

// 		return { type: type, indexes: indexes };
// 	};

// 	log.job.info('event', 'Starting alert event analysis...');

// 	/* TODO Update only if a new alert is present; una prima versione di questo controllo potrebbe essere una variable temp
// 	 * 		che viene settata a true quando si inserisce un alert, e settata a false dopo il controllo eventi.
// 	 *		Se settata a false, non rifa' il check
// 	 */

// 	const datespan = new Date(Date.parse(moment().subtract(eventAlertConf.expiration, 'week').format()));
// 	const galerts: any[] = await Alert.aggregate()
// 		.match({ time: { $gte: datespan } })
// 		.group({
// 			_id: { type: "$type" },
// 			alerts: { $push: { position: "$position", weight: "$weight" } }
// 		})
// 		.cursor({})
// 		.exec();

// 	Async.forEach (galerts, async g => {
// 		const res = await analyzeByType(g._id.type, g.alerts);
// 		for (const fi in res.indexes.features) {
// 			const f = res.indexes.features[fi];
// 			const ev = new Event();
// 			ev.geometry = f.geometry;
// 			ev.datasource = 'alert';
// 			ev.dataid = ev._id;
// 			ev.originid = ev._id;
// 			ev.type = res.type;
// 			ev.visible = false;
// 			ev.lastshakedate = new Date();
// 			ev.startdate = new Date();
// 			ev.epicenter = turf.centroid(f).geometry;
// 			ev.maxmagnitude = 6.0; // TODO adjust

// 			/* Geoquery sulle geometrie eventi, per verificare se un evento in quel periodo ha un area che
// 			 *  interseca quella dell'alertgenerated */
// 			const events = await Event.find({
// 				$and: [
// 					{
// 						$or: [
// 							{ geometry: { $geoIntersects: { $geometry: ev.geometry } } },
// 							{ geometry: { $geoWithin: { $geometry: ev.geometry } } },
// 							{ epicenter: ev.epicenter }
// 						]
// 					},
// 					{ lastshakedate: { $gte: Date.parse(moment().subtract(eventAlertConf.expiration, 'week').format()) } }
// 				]
// 			}).exec();

// 			if (events === null || events.length === 0) {
// 				log.job.info('event', `Created event ${ev._id} ${res.type} from alerts`);
// 				await ev.save();
// 				eventController.updateAffectedUsersForEvent(ev);
// 			} else {
// 				// TODO We need to verify if the new event intersects an old event generated by alerts, and if the area
// 				// is extended, we update the geometry
// 				log.job.debug('event', `Event ${res.type} from alerts not created because intersects ${events.length} other events`);
// 			}
// 		}
// 	});
// }




// // if (eventAlertConf.enabled) {
// // 	scheduler.addTask(eventAlertJob.updateAlertEvents, 300000);
// // }
