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

import { Router } from "express";
import config = require('../conf');

export interface BackofficeMenuItem {
	title: string;
	menu?: BackofficeMenuItem[];
	url?: string;
	icon?: string;
}

export interface BackofficeDescriptor {
	subof?: string;
	title: string;
	icon: string;
	menu?: BackofficeMenuItem[];
	url?: string;
}

export interface BackofficeMetric {
	code: string;
	ui: {
		name: string;
		description: string;
		icon: string;
		enabled: boolean;
		category: string;
		color?: string;
	};

	total(): Promise<number>;
	chart(timeframe: 'day' | 'week' | 'month' | 'year', start: Date, end: Date): any;
}


export function getModuleConfiguration(module: Module) {
	let defaultConfig = {};

	if ('config' in module) {
		defaultConfig = module.config;
	}

	if (module.name in config.modules)
		return { ...defaultConfig, ...config.modules[module.name] };
	else
		return { ...defaultConfig };
}

export function getModuleConfigurationFromName(moduleName: string) {
	if (moduleName in config.modules)
		return config.modules[moduleName];
	else
		return {};
}


export interface Module {
	name: string;
	enabled: boolean;
	require: Module[];

	config?: any;

	admin?: BackofficeDescriptor;
	metrics?: BackofficeMetric[];

	api?(): Router;
	adminApi?(): Router;
	jobs?: {
		job: () => void;
		timeout?: number;
		type?: 'onBlock' | 'onStart';
		onStart?: boolean;
		firstRun?: boolean;
	}[];
}
