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

import { Statistics } from "../modules/statistics/statistics.model";
import { Event } from "../modules/event/event.model";
import telegram = require('node-telegram-bot-api');
import moment = require('moment');
import conf = require('../conf');
import log = require('../log');
import { RedisCache } from "./cache";

const hbCache = new RedisCache();


export function start () {
	if (!conf.bot.telegram.enabled)
		return;

	const botHelp = 'Type:\n  /help\n  /lastevents\n  /stats';
	const bot = new telegram(conf.api.telegram.token, { polling: true });

	log.job.info('Telegram', 'Bot started');

	bot.onText(/\/help/, (msg) => {
		const fromId = msg.chat.id;
		bot.sendMessage(fromId, `${conf.env}: ${botHelp}`);
	});

	bot.onText(/\/start/, (msg) => {
		const fromId = msg.chat.id;
		bot.sendMessage(fromId, `${conf.env}: ${botHelp}`);
	});

	bot.onText(/\/stats/, async (msg) => {
		const fromId = msg.chat.id;

		const stats = await Statistics.findOne({ country: 'WRL' }).exec();
		let res = `${conf.env}: Stats:\n`;
		res += `  Users: ${stats.users}\n`;
		res += `  Single users: ${stats.singleusers}\n`;
		res += `  Companies: ${stats.companies}\n`;
		res += `  Organizations: ${stats.organizations}\n`;
		res += `  Events: ${stats.events}\n`;
		res += `  Donations: ${stats.donateddonations} (${stats.donated} BTC)\n`;
		res += `  Projects: ${stats.projects}\n`;
		res += `  Total Balance: ${await hbCache.get('totalbalance')} BTC`;
		bot.sendMessage(fromId, res);
	});

	bot.onText(/\/lastevents/, async (msg) => {
		const events: any = await Event.find({ visible: true, type: 'earthquake' }).sort({ lastshakedate: 'desc' }).limit(5).exec();
		const fromId = msg.chat.id;
		let d = 'Last events:\n';

		for (let i = 0; i < events.length; i++) {
			d += `${moment(events[i].lastshakedate).format()}: Earthquake in ${JSON.stringify(events[i].affectedcountries)} (mag: ${events[i].maxmagnitude})\n`;
		}

		bot.sendMessage(fromId, `${conf.env}: ${d}`);
	});
}
