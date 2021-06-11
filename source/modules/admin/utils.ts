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

import { Request } from "express";

export interface AdminQueryPaginateConfig {
	start?: number; 
	limit?: number; 
	by: string; 
	sort: string;
}

export type AdminPaginateRequest = Request<any,any,any,AdminQueryPaginateConfig>;

export async function adminQueryPaginate (query: any, page: AdminQueryPaginateConfig): Promise<{ results: any; pagination: any }> {
	const limit = Number(page.limit) || 25;
	const start = Number(page.start) || 0;

	const pagination: {
		start: number;
		limit: number;
		page: number;
		count: number;
		next?: string;
		prev?: string;
		sort?: string;
		by?: string;
	} = {
		'start': start,
		'limit': limit,
		'page': 0,
		'count': 0
	};
	
	const sortd = {};
	if (page.sort && page.by) {
		sortd[page.by] = page.sort == 'asc' ? 1 : -1;
	}

	const count = await query.countDocuments().exec();
	const results = await query.model.find({}).sort(sortd).merge(query).sort(sortd).limit(limit).skip(start).exec();

	if (start > 0) {
		const prev = (start > limit) ? start - limit : 0;
		pagination.prev = `?start=${prev}&limit=${limit}`;
		if (page.sort && page.by)
			pagination.prev += `&sort=${page.sort}&by=${page.by}`;
	}
	if (results.length >= limit) {
		pagination.next = `?start=${start + limit}&limit=${limit}`;
		if (page.sort && page.by)
			pagination.next += `&sort=${page.sort}&by=${page.by}`;
	}

	if (page.sort && page.by) {
		pagination.sort = page.sort;
		pagination.by = page.by;
	}
	pagination.count = count;
	pagination.page = pagination.start / pagination.limit;

	return {
		results: results,
		pagination: pagination
	};
}
