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

import log = require('../../../log');
import { AdminUser } from '../user.model';

export = async () => {
	const users = [
		{
			username: "gessa",
			email: "gessa@helperbit.com",
			privileges: ['admin', 'kyc', 'operator']
		},
		{
			username: "tinklit",
			email: "kyce@tinklit.it",
			privileges: ['kyc-thirdparty']
		}
	];
	log.debug('migration', 'Creating admin users to the database');

	for (const u of users) {
		const auser = new AdminUser();
		auser.username = u.username;
		auser.email = u.email;
		auser.password = 'test1';
		auser.privileges = u.privileges as any;
		auser.keyhandle = '';
		auser.publickey = '';
		auser.lastpasswordchange = new Date();

		try {
			await auser.save()
			log.debug('migration', `User ${u.username} created to mongo`);
		} catch (err) {
			log.error('migration', `Error creating admin ${u.username} to mongo: ${err}`);
		}
	}
};
