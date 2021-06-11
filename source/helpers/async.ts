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

import { NextFunction, Response } from "express";

export namespace Async {
	type ForEachCallback<T> = (value: T, index?: number, array?: T[]) => Promise<any>;
	type MapCallback<T> = (value: T, index?: number, array?: T[]) => Promise<any>;

	export async function forEach<T>(array: T[], callback: ForEachCallback<T>) {
		for (let index = 0; index < array.length; index++) {
			await callback(array[index], index, array);
		}
		return true;
	}

	export async function map<T>(array: T[], callback: MapCallback<T>) {
		const na = [];
		for (let index = 0; index < array.length; index++) {
			na.push (await callback(array[index], index, array));
		}
		return na;
	}

	export function middleware (fn: any) {
		return (req: Request, res: Response, next: NextFunction) => {
			Promise.resolve(fn(req, res, next)).catch(next);
		};
	}
}
