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
import { Statistics, StatisticsModel } from "./statistics.model";
import { Donation } from "../donation/donation.model";
import { QueryHelper } from "../../helpers/query";
import fb = require('fb');
import request = require('request-promise-native');
import { RedisCache } from "../../helpers/cache";
import error = require('../../error');
import { getModuleConfiguration } from "../module";
import { UserAuthSocialModule, UserAuthSocialConfig } from "../user.auth.social";

const hbCache = new RedisCache();



export async function getStats (req: Request, res: Response) {
	const stats = await Statistics.findOne({ country: 'WRL' }).exec();
	res.status(200);
	res.json({ users: stats.users, organizations: stats.organizations, events: stats.events, donations: stats.donateddonations, projects: stats.projects });
};


export async function getSocialStats (req: Request, res: Response) {
	let tw = 1066;
	let fb = 2380;
	try { tw = await hbCache.get('social_twitter'); } catch (err) { }
	try { fb = await hbCache.get('social_facebook'); } catch (err) { }
	res.status(200);
	res.json({ twitter: tw, facebook: fb });
};


export async function getWorldStats (req: Request, res: Response) {
	const world = await Statistics.find({}).sort({ country: 'asc' }).exec();

	const st = {};
	for (let i = 0; i < world.length; i++) {
		st[world[i].country] = world[i];
	}
	res.status(200);
	res.json(st);
};


export async function getShortCountryStats (req: Request, res: Response) {
	const stat = await Statistics.findOne({country: req.params.country}, '-topfivedonated -topfivereceived').sort({ country: 'asc' }).exec();

	res.status(200);
	res.json(stat);
};


export async function getCountryStats (req: Request, res: Response) {
	const ecountry = req.params.country;

	if (!ecountry)
		return error.response(res, 'E');

	const country = await StatisticsModel.getByCountry(ecountry);
	if (country === null)
		return error.response(res, 'E');

	res.status(200);
	res.json(country);
};


export async function updateSocial () {
	const socialConf = getModuleConfiguration(UserAuthSocialModule) as UserAuthSocialConfig;
	
	try {
		const body = await request.get({ url: "https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=Helperbit", json: true });
		await hbCache.set('social_twitter', parseInt(body[0].followers_count));
	} catch (ex) { }

	try {
		fb.options({
			appId: socialConf.facebook.appid,
			appSecret: socialConf.facebook.appsecret
		});

		fb.api('oauth/access_token', {
			client_id: socialConf.facebook.appid,
			client_secret: socialConf.facebook.appsecret,
			grant_type: 'client_credentials'
		}, function (res) {
			if(!res || res.error)
				return;
		
			fb.setAccessToken(res.access_token);
			fb.api('helperbit', { fields: ['fan_count'] }, async (res) => {
				if ('fan_count' in res) {
					await hbCache.set('social_facebook', res.fan_count);
				}
			});
		});
	} catch (err) {	}
};


/* GET api/stats/topdonors */
export async function getTopDonors (req: Request, res: Response) {
	const query: any = { status: 'confirmed', $or: [{ from: { $ne: null } }, { fromaddress: { $ne: null } }] };
	const frame = QueryHelper.timeframe(req.params.timeframe);

	if (frame)
		query.time = { $gte: new Date(frame.format()) };

	const topdonors: { country: string; user: string; volume: number; address: string; n: number }[]
		= await Donation.aggregate()
			.match(query)
			.group({
				_id: { $ifNull: ['$from', '$fromaddress'] },
				user: { $last: '$from' },
				address: { $last: '$fromaddress' },
				volume: { $sum: "$value" },
				n: { $sum: 1 }
			})
			.lookup({
				from: "users",
				localField: "user",
				foreignField: "username",
				as: "userob"
			})
			.project({
				country: { $arrayElemAt: ["$userob.country", 0] },
				user: '$user',
				volume: '$volume',
				address: '$address',
				n: '$n'
			})
			.sort({ volume: 'desc' })
			.limit(50)
			.exec();

	res.json({ topdonors: topdonors });
	res.status(200);
};

