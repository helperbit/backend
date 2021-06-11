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

import * as bitcoinjs from 'bitcoinjs-lib';

/* String to hex */
function s2h(str: string): string {
	return str;
}


export function toOPReturn(metadata: string) {
	/* Padding */
	if (metadata.length % 2 !== 0) metadata += '0';

	const data = Buffer.from(metadata, 'hex');
	return bitcoinjs.script.compile([bitcoinjs.opcodes.OP_RETURN, data]);
}

export function Metadata(): string {
	return '4842'; 						// Magicflag
}

/* TODO transform to a class */

/* Withdraw */
export function WithdrawMetadata() {
	let data = Metadata();
	data += '4';
	return data;
}


export function RORMetadata(ror: any): string {
	let data = Metadata();
	data += '6';
	data += s2h(ror.hash);
	return data;
}


/* Event */
export function EventMetadata(event: any): string {
	let data = Metadata();
	data += '2';						// Metadata type

	switch (event.datasource) {			// Data source
		case 'USGS':
			data += '1';
			break;
		case 'alert':
			data += '2';
			break;
		default:
			data += '0';
	}

	switch (event.type) {				// Event type
		case 'earthquake':
			data += '1';
			break;
		default:
			data += '0';
	}

	data += s2h(event.affectedcountries[0]);			// Country
	data += '' + Math.floor(event.maxmagnitude * 10);	// Magnitude

	data += '' + (event.epicenter.coordinates[0] < 0 ? '0' : '1') + Math.abs(Math.floor(event.epicenter.coordinates[0] * 100000)); // Epicenter
	data += '' + (event.epicenter.coordinates[1] < 0 ? '0' : '1') + Math.abs(Math.floor(event.epicenter.coordinates[1] * 100000)); // Epicenter

	data += event._id;							// Event ID
	return data;
}


/* Donations */
export function DonationMetadata(from: string, to?: string): string {
	let data = Metadata();
	data += '1';						// Metadata type

	if (from) data += s2h(from); 	// From country
	else data += '000000';

	if (to) data += s2h(to);		// To country
	else data += '000000';

	return data;
}

export function EventDonationMetadata(event: any, from: string, to?: string): string {
	let data = DonationMetadata(from, to);
	data += '1';						// Donation type
	data += event._id;

	return data;
}

export function ProjectDonationMetadata(project: any, from: string, to: string): string {
	let data = DonationMetadata(from, to);
	data += '2';						// Donation type
	data += project._id;

	return data;
}
