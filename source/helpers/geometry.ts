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

import turf = require('@turf/turf');
import us = require('underscore');
import { Point } from '@turf/meta';


export function geometryMatch(g1: any, g2: any): boolean {
	if (g1 === null || g2 === null)
		return false;

	return us.isMatch(g1.type, g2.type) && JSON.stringify(g1.coordinates) == JSON.stringify(g2.coordinates);
}

export function isGeometryEmpty(g) {
	if (g == null || g.coordinates.length == 0)
		return true;

	return false;	
}

export function pointDistance(p1: number[], p2: number[]): number {
	const point1: Point = {
		"type": "Point",
		"coordinates": p1
	};
	const point2: Point = {
		"type": "Point",
		"coordinates": p2
	};

	return turf.distance(point1, point2, 'kilometers');
}

