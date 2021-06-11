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

// import twitter = require('twitter');
// import log = require('../log');

// const client = new twitter({
// 	consumer_key: process.env.TWITTER_CONSUMER_KEY,
// 	consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
// 	access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
// 	access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
// });

// export function tweet (message: string){
// 	return new Promise((resolve, reject) => {
// 		client.post('statuses/update', { status: message }, function (error, tweet, response) {
// 			if (error) return reject(error);

// 			console.log(tweet);  // Tweet body.
// 			console.log(response);  // Raw response object.

// 			return resolve(response);
// 		});
// 	});
// }
