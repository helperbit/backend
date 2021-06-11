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

import log = require('../log');
import telegram = require('node-telegram-bot-api');
import conf = require('../conf');

export function notify(message: string, req?: any) {
	message = conf.env + ': ' + message;

	if (req && 'ip' in req)
		message += ` [${req.ip}]`;

	log.debug('telegram', message);

	if (!conf.bot.telegram.enabled)
		return;

	const bot = new telegram(conf.api.telegram.token, { polling: false });
	const chs = conf.bot.telegram.notify;

	for (let i = 0; i < chs.length; i++) {
		bot.sendMessage(chs[i], message);
	}
}


export function notifyChannel(message: string) { }
