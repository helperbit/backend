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

import jwt = require('jsonwebtoken');
import conf = require('../conf');
import bcrypt = require('bcrypt');
import crypto = require('crypto');

export function sha1(data: string): string {
	return crypto.createHash('sha1').update(data).digest('hex');
}

export function sha256(data: string): string {
	return crypto.createHash('sha256').update(data).digest('hex');
}

export function signToken(payload: any, expiration: string) {
	/* Add some randomness to the token */
	payload['rnd'] = Math.random();

	return jwt.sign(payload, conf.security.secret, { expiresIn: expiration, algorithm: 'HS256' });
}

export function verifyToken(bearerToken: string): Promise<any> {
	return new Promise((resolve, reject) => {
		jwt.verify(bearerToken, conf.security.secret, { algorithm: 'HS256' }, (err, decoded) => {
			if (err) return reject(err);

			return resolve(decoded);
		});
	})
}

export function tokenize(token: string, sha?: boolean): Promise<string> {
	return new Promise((resolve, reject) => {
		if (sha === undefined) sha = true;

		bcrypt.genSalt(5, (err, salt) => {
			if (err)
				return reject(err);

			bcrypt.hash(token, salt, (err, hash) => {
				if (err)
					return reject(err);

				resolve(sha ? sha256(hash) : hash);
			});
		});
	})
}
