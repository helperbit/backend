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

import { AdminLog } from "./log.model";
import telegramHelper = require('../../helpers/telegram');


export async function login (req: any) {
	const adentry = new AdminLog();
	adentry.type = 'login';
	adentry.context = 'Admin';
	adentry.description = ``;
	adentry.user = req.session.user;
	adentry.ip = req.ip;
	await adentry.save();
	telegramHelper.notify(`Admin - Login ${adentry.user} (${adentry.ip})`);
};

export async function loginfail (req: any) {
	const adentry = new AdminLog();
	adentry.type = 'loginfail';
	adentry.context = 'Admin';
	adentry.description = `incorrect credentials`;
	adentry.user = req.session.user;
	adentry.ip = req.ip;
	await adentry.save();
	telegramHelper.notify(`Admin - Unsucessful login ${adentry.user} (${adentry.ip})`);
};

export async function loginfailu2f (req: any) {
	const adentry = new AdminLog();
	adentry.type = 'loginfail';
	adentry.context = 'Admin';
	adentry.description = `correct credentials but wrong u2f`;
	adentry.user = req.session.user;
	adentry.ip = req.ip;
	await adentry.save();
	telegramHelper.notify(`Admin - Unsucessful u2f login ${adentry.user} (${adentry.ip})`);
};

export async function logout (req: any) {
	const adentry = new AdminLog();
	adentry.type = 'logout';
	adentry.context = 'Admin';
	adentry.description = ``;
	adentry.user = req.session.user;
	adentry.ip = req.ip;
	await adentry.save();
	telegramHelper.notify(`Admin - Logout ${adentry.user} (${adentry.ip})`);
};


export async function changepassword (req: any) {
	const adentry = new AdminLog();
	adentry.type = 'changepassword';
	adentry.context = 'Admin';
	adentry.description = ``;
	adentry.user = req.session.user;
	adentry.ip = req.ip;
	await adentry.save();
	telegramHelper.notify(`Admin - ${adentry.user} changed password (${adentry.ip})`);
};

export async function operation (req: any, context: string, description: string, relateduser?: string) {
	const adentry = new AdminLog();
	adentry.type = 'operation';
	adentry.context = context;
	adentry.description = description;
	adentry.user = req.session.user;
	adentry.relateduser = relateduser;
	adentry.ip = req.ip;
	await adentry.save();
	telegramHelper.notify(`Admin - ${adentry.user} (${adentry.ip}) - ${adentry.context} - ${adentry.relateduser || ''} ${adentry.description}`);
};
