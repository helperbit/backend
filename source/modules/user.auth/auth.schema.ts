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

export const signup: ValidationSchema = {
	username: {
		required: true,
		type: 'username',
		min: 4,
		max: 32
	},
	password: {
		required: true,
		type: 'string',
		min: 8
	},
	email: {
		required: true,
		type: 'email'
	},
	terms: {
		required: true,
		type: 'boolean',
		value: true
	},
	newsletter: {
		required: true,
		type: 'boolean'
	},
	subtype: {
		required: false,
		type: 'string'
	},
	language: {
		required: false,
		type: 'string'
	}
};

export const socialEdit: ValidationSchema = {
	password: {
		required: true,
		type: 'string',
		min: 8
	},
	email: {
		required: true,
		type: 'email'
	}
};

export const login: ValidationSchema = {
	user: {
		required: true,
		type: 'mailorusername',
		error: 'EL1'
	},
	password: {
		required: true,
		type: 'string'
	},
	language: {
		required: false,
		type: 'string'
	}
};

export const resetPassword: ValidationSchema = {
	email: {
		required: true,
		type: 'email',
		error: 'ER1'
	}
};

export const activateAccount: ValidationSchema = {
	email: {
		required: true,
		type: 'email'
	},
	token: {
		required: true,
		type: 'string'
	}
};
