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

/* eslint prefer-const: 0 */

export const TString = {
	en: { type: String, default: '' },
	it: { type: String, default: null },
	es: { type: String, default: null },
	de: { type: String, default: null },
	ru: { type: String, default: null },
	fr: { type: String, default: null },
};

export interface $TString {
	en?: string;
	it?: string;
	es?: string;
	de?: string;
	ru?: string;
	fr?: string;
}


export type $ChangeHistory = {
	changeDate?: Date;
	content: any;
}[];

export interface $GiftData {
	enabled: boolean;
	email?: string;
	name: string;
	message: string;
	sent?: boolean;
	token?: string;
}

export function validateID (id: string) {
	const idregexp = new RegExp("^[0-9a-fA-F]{24}$");
	return idregexp.test(id);
}


export const hardwareWallets = ['none', 'ledgernanos']; // , 'trezorone', 'trezort'];
