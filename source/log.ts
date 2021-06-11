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

import colors = require('colors');
import morgan = require('morgan');
import conf = require('./conf');
import cluster = require('cluster');
import telegramHelper = require('./helpers/telegram');
import { Request } from 'express';

if (conf.logs.colors) {
	colors.enabled = true;
}

const clfmonth = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function pad2(str: number): string {
	let str2: string = String(str);

	while (str2.length < 2)
		str2 = '0' + str2;

	return str2;
}

function clfDate(): string {
	const dateTime: Date = new Date();
	const date: number = dateTime.getUTCDate();
	const hour: number = dateTime.getUTCHours();
	const mins: number = dateTime.getUTCMinutes();
	const secs: number = dateTime.getUTCSeconds();
	const year: number = dateTime.getUTCFullYear();
	const month: string = clfmonth[dateTime.getUTCMonth()];

	if (conf.logs.date)
		return `[${pad2(date)}/${month}/${year}:${pad2(hour)}:${pad2(mins)}:${pad2(secs)} +0000] `;
	else
		return '';
}

function workerInfo() {
	if (cluster.worker)
		return colors.red('worker' + cluster.worker.id) + ' - ';
	else
		return ''
}

morgan.token('username', function (req, res) { if (req.username) { return req.username; } else { return ''; } })

if (conf.logs.date) {
	morgan.format('route', colors.magenta('[:date[clf]] ') + workerInfo() + colors.cyan('[route]') + ' ' +
		colors.yellow(':method') + colors.red(' :status') + colors.yellow(' :response-time ms') +
		colors.blue(' :res[content-length]B') + colors.cyan(' [:username]') + colors.magenta(' :url'));
} else {
	morgan.format('route', workerInfo() + colors.cyan('[route]') + ' ' +
		colors.yellow(':method') + colors.red(' :status') + colors.yellow(' :response-time ms') +
		colors.blue(' :res[content-length]B') + colors.cyan(' [:username]') + colors.magenta(' :url'));
}

function maybeUser(req?: any) {
	return req && 'username' in req ? colors.cyan(`[${req.username}] `) : '';
}

export function debug(mod: string, message: string, req?: Request) {
	console.log(colors.magenta(clfDate()) + workerInfo() + colors.cyan(`[${mod}]`) + ' ' + maybeUser() + colors.green(message));
}

export function debuggrey(mod: string, message: string, req?: Request) {
	console.log(colors.magenta(clfDate()) + workerInfo() + colors.cyan(`[${mod}]`) + ' ' + maybeUser() + colors.grey(message));
}

export function critical(mod: string, message: string, req?: Request) {
	console.log(colors.magenta(clfDate()) + workerInfo() + colors.yellow(`[${mod}]`) + ' ' + maybeUser() + colors.red(message));
}

export function error(mod: string, message: string, req?: Request) {
	console.log(colors.magenta(clfDate()) + workerInfo() + colors.yellow(`[${mod}]`) + ' ' + maybeUser() + colors.red(message));
}

export function admin(method: string, endpoint: string) {
	console.log(colors.magenta(clfDate()) + workerInfo() + colors.underline.yellow('[admin]') + ' ' +
		colors.yellow(method) + ' ' + colors.magenta(endpoint));
}

export module job {
	export function debug(mod: string, message: string, opts?: { telegram: boolean }) {
		console.log(colors.magenta(clfDate()) +
			colors.yellow(`[${mod}]`) + ' ' + colors.cyan('[job]') + ' ' + colors.blue(message));
		if (opts && 'telegram' in opts && opts.telegram)
			telegramHelper.notify(`${mod} - ${message}`);
	}

	export function error(mod: string, message: string, opts?: { telegram: boolean }) {
		console.log(colors.magenta(clfDate()) +
			colors.yellow(`[${mod}]`) + ' ' + colors.cyan('[job]') + ' ' + colors.red(message));
		if (opts && 'telegram' in opts && opts.telegram)
			telegramHelper.notify(`${mod} - ${message}`);
	}

	export function info(mod: string, message: string, opts?: { telegram: boolean }) {
		console.log(colors.magenta(clfDate()) +
			colors.yellow(`[${mod}]`) + ' ' + colors.cyan('[job]') + ' ' + colors.cyan(message));
		if (opts && 'telegram' in opts && opts.telegram)
			telegramHelper.notify(`${mod} - ${message}`);
	}
}
