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

export function interpolate(str: string, jobj: any): string {
	let res: string = '';
	let loop: boolean = true;

	while (loop) {
		const i = str.indexOf('{{');

		if (i != -1) {
			res += str.substr(0, i);
			const j = str.indexOf('}}');
			const n = str.substr(i + 2, j - i - 2);

			if (n in jobj) res += jobj[n];

			str = str.substr(j + 2, str.length - j - 2);
		}
		else loop = false;
	}

	return (res + str);
}

export function interpolateHTML(str: string, jobj: any): string {
	let res: string = '';
	let loop: boolean = true;

	while (loop) {
		const i = str.indexOf('{{');

		if (i != -1) {
			res += str.substr(0, i);
			const j = str.indexOf('}}');
			const n = str.substr(i + 2, j - i - 2);

			if (n in jobj) {
				if (n == 'url')
					res += `<a href="${jobj[n]}">${jobj[n]}</a>`;
				else
					res += jobj[n];
			}

			str = str.substr(j + 2, str.length - j - 2);
		}
		else loop = false;
	}

	return (res + str);
}

export function capitalizeFirstLetter(str: string): string {
	if (str === undefined || str === null || str.length < 2)
		return str;

	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
