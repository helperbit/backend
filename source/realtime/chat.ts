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
import socketio = require('socket.io');

export default class ChatRealtime {
	get name() { return 'chat'; }
	get trigger() { return 'chat message'; }

	handler(io: typeof socketio, username: string) {
		return (room, message) => {
			/* Input validation */
			if (message.length > 512)
				message = message.substring(0, 512);

			const expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
			message = message.replace(expression, '****');
			message = message.replace(/<[^>]*>/gi, '');

			/* */
			log.debug('chat', `New message: ${username} -> ${room}`);
			io.emit('chat message', username, room, message);
		}
	}
}
