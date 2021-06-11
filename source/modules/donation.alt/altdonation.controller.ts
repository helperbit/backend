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

import { Request, Response } from "express";
import { $DonationDocument, DonationModel } from "../donation/donation.model";
import { $AltDonationDocument, AltDonation, AltDonationModel } from "./altdonation.model";
import moment = require('moment');
import error = require('../../error');
import flypme = require('../../helpers/flypme');


export async function create (donation, altcurrency, address) {
	const order = await flypme.createOrder(altcurrency, donation.value, address);
	donation.expiry = moment().add(order.expires + 120, 'seconds').format();
	donation.value = parseFloat(order.order.ordered_amount);
	donation.to[0].value = donation.value;
	donation.fromcurrency = altcurrency;
	const altdon = new AltDonation();
	altdon.expiry = moment().add(order.expires, 'seconds').toDate();
	altdon.donation = donation._id;
	altdon.currency = altcurrency;
	altdon.order = order.order.uuid;
	altdon.amount = parseFloat(order.order.invoiced_amount);
	altdon.address = order.deposit_address;
	altdon.toaddress = address;

	return altdon;
};

/* GET api/donation/i/:id */
export async function getAltByID (req: Request, res: Response) {
	const donation: $DonationDocument = await DonationModel.getByID(req.params.id);

	if (donation.altdonation) {
		const adonation: $AltDonationDocument = await AltDonationModel.getByID(donation.altdonation);
		if (adonation !== null) {
			res.status(200);
			res.json(adonation);
		} else {
			error.response(res, 'E2');
		}
	} else {
		error.response(res, 'E2');
	}
};
