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

import mailHelper = require('./mail');
import telegramHelper = require('./telegram');
// import twitterHelper = require('./twitter');

export interface BroadcastConfig {
	twitter?: boolean;
	facebook?: boolean;
	linkedin?: boolean;
	telegramBot?: boolean;
	telegramChannel?: boolean;
	infoMail?: boolean;

	message: string;
	subject?: string;
}

export default async function broadcast (config: BroadcastConfig) {
	if (!('message' in config))
		return false;

	if (!('twitter' in config))
		config.twitter = false;
	if (!('facebook' in config))
		config.facebook = false;
	if (!('linkedin' in config))
		config.linkedin = false;
	if (!('telegramBot' in config))
		config.telegramBot = false;
	if (!('telegramChannel' in config))
		config.telegramChannel = false;
	if (!('infoMail' in config))
		config.infoMail = false;

	if (config.telegramBot)
		await telegramHelper.notify(config.message);
	// if (config.twitter)
	//	await twitterHelper.tweet(config.message);
	// if (config.facebook)
	// if (config.linkedin)
	if (config.infoMail)
		await mailHelper.send('info@helperbit.com', config.subject || config.message, config.message);
	// if (config.telegramChannel)
	//	await telegramHelper.notifyChannel(config.message);

	return true;
}
