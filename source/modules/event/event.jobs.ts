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

import { $EventDocument, Event, EventTypeEnum, $Earthquake } from "./event.model";
import { Async } from "../../helpers/async";
import log = require('../../log');
import conf = require('../../conf');
import eventController = require('./event.controller');
import geometryHelper = require('../../helpers/geometry');
import { EarthquakeEventGetter, EarthquakeEventType } from "../../gis/earthquake";
import { EventGetter } from "../../gis/event_getter";
import { CommonEventType } from "../../gis/types";
import { EventGetters } from "../../gis";
import { getModuleConfiguration } from "../module";
import stringHelper = require('../../helpers/string');
import { EventConfig, EventModule } from ".";
import moment = require("moment");
import broadcast from "../../helpers/broadcast";
import { FloodEventGetter, FloodEventType } from "../../gis/flood";
import e = require("express");
import { MultiPolygon } from "geojson";

const sliceSize = 50;
const moduleName = 'event';

/* Update step */
const inProgress = {};
let firststart = true;

/* Download an image from url, saving it in filename */
// function downloadImage (uri, filename, callback) {
// 	request.head(uri, (err, res, body) => {
// 		request(uri).pipe(fs.createWriteStream(filename)).on('close', () => {
// 			callback(res.headers['content-length'], res.headers['content-type']);
// 		});
// 	});
// }

/* Download an image given the google reference, then upload it in mongo */
// function getImage (reference, maxWidth, maxHeight, handler) {
// 	request({ url: 'https://maps.googleapis.com/maps/api/place/photo?key=' + conf.api.google.key + '&photoreference=' + reference + '&maxwidth=' + maxWidth + '&maxheight=' + maxHeight },
// 		(err, response, str) => {
// 			str = str.split('HREF="')[1].split('">')[0];

// 			let randhash = crypto.createHash('sha1').update(Math.random().toString()).digest('hex');
// 			let filename = 'temp/eventimage-' + randhash;

// 			downloadImage(str, filename, (size, contenttype) => {
// 				await mediaController.upload({ path: filename, size: size, headers: { 'content-type': contenttype } }, (img, body) => {
// 					img.save((err, img) => { handler(err, img); });
// 				});
// 			});
// 		}
// 	);
// }

/* Get images for a given event as list of n raw images */
// function getImages (n, geometry, eventtype, handler) {
// 	request({ url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${conf.api.google.key}&location=${geometry.coordinates[1]},${geometry.coordinates[0]}&radius=50000`, json: true },
// 		(err, res, data) => {
// 			if (err !== null || data === null)
// 				return log.job.error(moduleName, `Problem getting images: ${err.message}`);

// 			const images = [];

// 			for (let x = 0; x < data.results.length && images.length < n; x++) {
// 				const item = data.results[x];
// 				if ('photos' in item) {
// 					const ph = item.photos[0].photo_reference;
// 					images.push({ 'reference': ph, 'name': item.name });
// 				}
// 			}
// 			handler(images);
// 		}
// 	);
// }


// function broadcastMetadata (event, handler) {
// 	setTimeout(async () => {
// 		// TODO: fix
// 		// let txb: bitcoinjs.Psbt = null;
// 		// try {
// 		// 	const res = await bitcoinHelper.prepareTransaction({
// 		// 		wallet: { address: conf.blockchain.faucet.address, ismultisig: false, scripttype: 'p2sh' },
// 		// 		value: conf.blockchain.limits.min.fee,
// 		// 		fee: conf.blockchain.limits.min.fee,
// 		// 		address: conf.blockchain.faucet.address,
// 		// 		wif: conf.blockchain.faucet.privkey
// 		// 	});
// 		// 	txb = res.psbt;
// 		// } catch (err) { }

// 		// const tx = txb.finalizeAllInputs().extractTransaction();
// 		// const txid = tx.getId();

// 		// try {
// 		// 	const txid = await Blockchain.pushTransaction(tx.toHex());
// 		// 	log.job.info(moduleName, `Broadcasted metadata: ${event._id} ${txid}`);
// 		// 	event.metatx = txid;
// 		// 	handler(event);
// 		// } catch (err) { }
// 	}, Math.random() * 60);
// }


/* Add an earthquake row if missing, used on unwind */
export async function fixEmptyEarthquakes() {
	const events: $EventDocument[] = await Event.find({}).exec(); //type: 'earthquake' 
	await Async.forEach(events, async e => {
		if (e.earthquakes.length > 0) return;

		log.job.debug(moduleName, `Fixing missing earthquakes for event: ${e._id}`);

		e.earthquakes.push({
			magnitude: e.maxmagnitude,
			date: e.lastshakedate,
			epicenter: e.epicenter
		});
		e.markModified("earthquakes");
		await e.save();
	});
}


interface EventUpdateOptions {
	item: CommonEventType;
	eventRaw: $EventDocument;
	isNew: boolean;
	getter: EventGetter<any>;
}

async function floodUpdate(opts: EventUpdateOptions): Promise<$EventDocument> {
	const getter: FloodEventGetter = opts.getter as FloodEventGetter;
	let event: $EventDocument = await getter.parseCommon(opts.eventRaw, opts.item);
	event = await getter.parse(opts.eventRaw, opts.item as FloodEventType);
	await event.save();
	return event;
}

async function earthquakeUpdate(opts: EventUpdateOptions): Promise<$EventDocument> {
	const getter: EarthquakeEventGetter = opts.getter as EarthquakeEventGetter;
	const moduleConfig = getModuleConfiguration(EventModule) as EventConfig;
	let event: $EventDocument = await getter.parseCommon(opts.eventRaw, opts.item);
	event = await getter.parse(opts.eventRaw, opts.item as EarthquakeEventType);
	await event.save();

	/* Only if lastshake is not 2 month behind */
	if (moment(event.lastshakedate) > moment().subtract(2, 'month') || event.earthquakes.length == 0 || firststart) {
		try {
			const data = await getter.getEarthquakes(event.originid);
			const oldeq = event.earthquakes;
			event.earthquakes = [];

			for (let i = 0; i < data.features.length; i++) {
				const item = data.features[i];
				const dtime = new Date(parseInt(item.properties.time));

				const eq: $Earthquake = {
					magnitude: item.properties.mag,
					date: dtime,
					epicenter: item.geometry as any
				};

				if (eq.magnitude >= moduleConfig.earthquake.minShakeMagnitude)
					event.earthquakes.push(eq);
			}
			await event.save();

			if (oldeq.length < event.earthquakes.length)
				log.job.debug(moduleName, `Event: ${event._id} update with ${event.earthquakes.length} earthquakes`);

			/* Get new quakes (if any), and send a notification */
			if (event.earthquakes.length > oldeq.length && oldeq.length > 0) {
				const ne = event.earthquakes.filter(
					q => oldeq.filter(
						o => (
							o.epicenter.coordinates[0] == q.epicenter.coordinates[0]
							&&
							o.epicenter.coordinates[1] == q.epicenter.coordinates[1]
						)).length == 0);

				ne.forEach(e => {
					broadcast({
						infoMail: true,
						telegramBot: true,
						message: `${e.date.toString()} - New quake related to event ${event._id}: ${JSON.stringify(event.affectedcountries)} (mag: ${e.magnitude}, affected: ${event.population.affected})\n${conf.url}/event/${event._id}`,
						subject: `[Event] New quake in ${event._id} detected`
					});
				});
			}
		} catch (err) { }
	}
	return event;
}


async function processEvents(t: EventTypeEnum, getter: EventGetter<any>, firststart: boolean) {
	const moduleConfig = getModuleConfiguration(EventModule) as EventConfig;
	const updaters = {
		'earthquake': earthquakeUpdate,
		// 'wildfire':
		'flood': floodUpdate
	};

	if (!(t in updaters))
		return;

	let event_n = 0;
	const usgs_ids = [];


	const eventUpdate = async (item) => {
		let isNew = false;
		event_n++;

		// quickfix of gianluca bug
		if (t == 'earthquake') {
			if (usgs_ids.indexOf(item.properties.usgs_name_first) != -1)
				return;

			usgs_ids.push(item.properties.usgs_name_first);
		}

		let dataid = item.properties.usgs_name_first || item.properties.id_evento;
		const dataidall = item.properties.usgs_name_all || [item.properties.id_evento];

		dataidall.map(did => { return did.replace("'", ""); });
		dataid = dataid.replace("'", "");

		let event: $EventDocument = await Event.findOne({ $or: [{ dataid: { $in: dataidall } }, { dataid: dataid }] }).exec();

		if (!getter.shouldBeProcessed(item)) {
			if (event !== null)
				Event.remove({ _id: event._id }, err => { });

			return;
		}

		if (event === null) {
			event = new Event({ originid: item.properties.id_evento, dataid: dataid, type: t, visible: true });

			await event.save();

			log.job.info(moduleName, `Event: ${event._id} created`);
			isNew = true;
		}

		/* Origin id */
		if (event.originid != item.properties.id_evento) {
			event.originid = item.properties.id_evento;
			await event.save();
		}


		/* if (event.dataid != item.properties.usgs_name_first) {
			event.dataid = item.properties.usgs_name_first;
			await event.save ();
		}*/

		try {
			event = await updaters[t]({ getter: getter, item: item, eventRaw: event, isNew: isNew });
			if (event.isModified())
				log.job.info(moduleName, `Event ${t} ${event._id} updated.`);
		} catch (err) {
			log.job.error(moduleName, err);
		}

		/* Area */
		if (event.geometry == null || (event.geometry as MultiPolygon).coordinates.length == 0) {
			try {
				const area = await getter.getArea(event.originid);
				if (!geometryHelper.geometryMatch(event.geometry, area)) {
					event.geometry = area as any;
					await event.save();
					await eventController.updateAffectedUsersForEvent(event);
					log.job.debug(moduleName, `Event: ${event._id} update with new area`);
				}
			} catch (err) {
				log.job.error(moduleName, `Event: ${event._id} error getting area  ${err}`);
			}
		}
		if (firststart && event.geometry && event.visible)
			await eventController.updateAffectedUsersForEvent(event);

		/* Shakemaps */
		if ((event.shakemaps.length == 0 && !event.issea) || (firststart && !event.issea)) {
			try {
				const shakemaps = await getter.getAreaLayers(event.originid);
				if (!(shakemaps === null || (event.shakemaps.length == shakemaps.length && !firststart))) {
					const oldshakemaps = event.shakemaps || [];
					event.shakemaps = shakemaps as any;
					await event.save();
					await eventController.updateAffectedUsersForEvent(event);
					if (oldshakemaps.length < event.shakemaps.length)
						log.job.debug(moduleName, `Event: ${event._id} update with new area layers`);
				}
			} catch (err) {
				// log.job.error(moduleName, `Event: ${event._id} error getting shakemaps ${err}`);
			}
		}

		/* Nearest cities */
		if (event.nearcities.length == 0 && !event.nearcity.name) {
			try {
				const cities = await getter.getEventNearestCities(event.originid);

				if (cities.length != 0) {
					const ncold = event.nearcities.length || 0;

					event.nearcities = [];

					cities.forEach(city => {
						if (city.properties.tipo == 'Capitale') {
							event.capital.position = { coordinates: city.geometry.coordinates, type: city.geometry.type };
						} else {
							event.nearcities.push({
								population: city.properties.popolazione,
								distance: city.properties.distanza,
								name: stringHelper.capitalizeFirstLetter(city.properties.abitati),
								position: { coordinates: city.geometry.coordinates, type: city.geometry.type }
							});
						}
					});

					event.markModified("capital");
					event.markModified("nearcities");
					await event.save();

					if (ncold < event.nearcities.length)
						log.job.debug(moduleName, `Event: ${event._id} update with new ${event.nearcities.length} nearest cities`);
				}
			} catch (err) { }
		}

		/* Images */
		// if (event.images.length < eventConf.images.number && eventConf.images.enabled) {
		// 	log.job (moduleName, 'Retrieving images for event: '+event._id);
		// 	event.images = [];
		// 	getImages (eventConf.images.number, event.epicenter, 'earthquake', (images) => {
		// 		images.forEach ((image) => {
		// 			getImage (image.reference, 800, 800, (err, img) => {
		// 				if (!err) {
		// 					log.job (moduleName, 'New image for event, ' + img._id);
		// 					event.images.push (img._id);
		// 					event.save ();
		// 				}
		// 			});
		// 		});
		// 	});
		// }


		event.visible = getter.shouldBeVisible(item, event);
		await event.save();

		/* Send a telegram notify and a mail alert to info@helperbit.com */
		if (isNew && moment(item.properties.last_shake_time) >= moment().subtract(1, 'weeks')) {
			broadcast({
				infoMail: true,
				telegramBot: true,

				message: `${t} - New event in: ${item.properties.affected_countries || item.properties.country} (mag: ${event.maxmagnitude}). ${event.visible ? conf.url + '/event/' + event._id : ''}`,
				subject: `[Event] New event of type ${t} detected`
			});
		}

		return;
	};

	inProgress[t] = true;
	let data: CommonEventType[] = await getter.getList(firststart ? { limit: 1500 } : {});

	if (!data) {
		log.job.error(moduleName, 'Null data');
		inProgress[t] = false;
		return;
	}

	if (data.length === 0) {
		log.job.info(moduleName, 'No new events');
		inProgress[t] = false;
		return;
	}

	// data = data.slice(0,10);
	const total = data.length;
	data = data.filter(item =>
		new Date(Date.parse(item.properties.start_time)).getFullYear() >= moduleConfig.minYear
		&&
		item.properties.country
	);
	log.job.info(moduleName, `Parsing ${data.length} ${t} events (${total - data.length} discarded)`);

	for (let i = 0; i < data.length; i += sliceSize) {
		const pardata = data.slice(i, i + sliceSize);
		log.job.debug(moduleName, `Processing events from ${i} to ${i + sliceSize} of ${data.length} (${event_n} done)`);
		try {
			await Promise.all(pardata.map(p => eventUpdate(p)));
		} catch (err) {
			log.job.error(moduleName, err);
		}
	}
	log.job.info(moduleName, `${event_n} compatible ${t} events are up to date`);
	inProgress[t] = false;
}



export async function update(t: EventTypeEnum) {
	if (!(t in inProgress))
		inProgress[t] = false;

	if (inProgress[t]) {
		return log.job.info(moduleName, `Polling already in progress for ${t}.`);
	}
	log.job.info(moduleName, `Starting ${t} event polling...`);

	if (t in EventGetters) {
		try {
			processEvents(t, EventGetters[t](), firststart);
			firststart = false;
		} catch (err) {
			inProgress[t] = false;
			return log.job.error(moduleName, `Problem with event get request: ${err}`);
		}
	} else {
		log.job.error(moduleName, `Provider ${t} not available.`);
	}
}
