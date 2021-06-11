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

export const create: ValidationSchema = {
	title: { 
		required: true, 
		type: 'tstring', 
		min: 1,
		max: 256
	},
	description: { 
		required: true, 
		type: 'tstring', 
		min: 1
	},
	target: { 
		required: true, 
		type: 'number', 
		min: 1
	},
	currency: { 
		required: true, 
		type: 'currency'
	},
	receiveaddress: {
		required: true,
		type: 'address'
	}
};

export const update: ValidationSchema = {
	title: { 
		required: false, 
		type: 'tstring', 
		min: 1 
	},
	description: { 
		required: false, 
		type: 'tstring',
		min: 1 
	},
	target: { 
		required: false, 
		type: 'number', 
		min: 1
	},
	currency: { 
		required: false, 
		type: 'currency'
	},
	receiveaddress: {
		required: false,
		type: 'address'
	},
	tags: {
		required: false,
		type: 'tags'
	}
};



export const activityCreate: ValidationSchema = {
	title: { 
		required: true, 
		type: 'tstring', 
		min: 1 
	},
	description: { 
		required: false, 
		type: 'tstring', 
		min: 1 
	},
	// target: { 
	// 	required: true, 
	// 	type: 'number', 
	// 	min: 0
	// },
	category: { 
		required: true, 
		type: 'string'
	}
};

export const activityEdit: ValidationSchema = {
	title: { 
		required: false, 
		type: 'tstring', 
		min: 1 
	},
	description: { 
		required: false, 
		type: 'tstring', 
		min: 1 
	},
	// target: { 
	// 	required: false, 
	// 	type: 'number', 
	// 	min: 0
	// },
	category: { 
		required: true, 
		type: 'string'
	}
};
