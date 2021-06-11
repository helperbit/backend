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

import { Module } from "../module";
import express = require('express');
import { AdminApi } from "./admin.api";
import { ModuleRepository } from "..";

export const AdminModule: Module = {
	name: 'admin',
	require: [],
	enabled: true,

	admin: {
		title: 'Dashboard',
		icon: 'fa-dashboard',
		menu: [
			{ icon: 'fa-home', title: 'Summary', url: '/admin' }
		]
	},

	adminApi() {
		const router = AdminApi;

		ModuleRepository.i().list().forEach(m => {
			if (m.name != 'admin' && 'adminApi' in m)
				router.use('/', m.adminApi());
		});
		
		return router;
	}
};
