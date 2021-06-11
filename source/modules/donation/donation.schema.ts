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

import { ValidationSchema } from "../../helpers/schema-validator";
import conf = require ('../../conf');

export const createEventDonation: ValidationSchema = {
	address: { 
		required: true, 
		type: 'string' 
	},
	value: { 
		required: true, 
		type: 'number', 
		min: conf.blockchain.limits.min.donation, 
		error: 'E3' 
	},
	fee: { 
		required: true, 
		type: 'number', 
		error: 'E3' 
	},
	users: {
		required: true,
		type: 'array'
	}
};

export const donate: ValidationSchema = {
	amount: { 
		required: true, 
		type: 'number', 
		min: conf.blockchain.limits.min.donation, 
		max: conf.blockchain.limits.max.donation
	}		
};

