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

import { utxoSelector, estimateTransactionSizeSync, EstimateTransactionFeeOptionsExtend } from "./bitcoin";
import { $WalletDocument } from "../modules/wallet/wallet.model";

const sets = {
	'a': [
		{ tx: 'a', n: 0, value: 0.0001}, { tx: 'a', n: 0, value: 0.0009},
		{ tx: 'a', n: 0, value: 0.0005}, { tx: 'a', n: 0, value: 0.0004},
		{ tx: 'a', n: 0, value: 0.0009}, { tx: 'a', n: 0, value: 0.01}
	]
};

describe('utxoSelector', () => {
	it('should select correct inputs with bestInputNumber=4', () => {
		const set = utxoSelector({
			set: sets.a,
			value: 0.007,
			bestInputNumber: 4
		});
		expect(set.set.length).toBe(4);
		expect(set.rest.length).toBe(2);
		expect(set.set.reduce((a,b) => a + Number(b.value), 0.0)).toBeGreaterThan(0.007);
	});
	
	it('should select correct inputs with bestInputNumber=1', () => {
		const set = utxoSelector({
			set: sets.a,
			value: 0.007,
			bestInputNumber: 1
		});
		expect(set.set.length).toBe(1);
		expect(set.rest.length).toBe(5);
		expect(set.set.reduce((a,b) => a + Number(b.value), 0.0)).toBeGreaterThan(0.007);
	});
	
	it('should return a positive value if value greater than balance', () => {
		const set = utxoSelector({
			set: sets.a,
			value: 0.1
		});
		expect(set.value).toBeGreaterThan(0);
	});
	
	it('should select all inputs', () => {
		const set = utxoSelector({
			set: sets.a,
			value: sets.a.reduce((a,b) => a + Number(b.value), 0.0)
		});
		expect(Math.round(set.value * 10000000)).toBe(0);
		expect(set.set.length).toBe(sets.a.length);
		expect(set.rest.length).toBe(0);
	});
});



describe('estimateTransactionSizeSync', () => {
	it('should compute transaction size', () => {
		const v = estimateTransactionSizeSync({
			address: '12',
			unspent: sets.a,
			value: sets.a.reduce((a,b) => a + Number(b.value), 0.0),
			wallet: {
				scripttype: 'p2wsh',
				ismultisig: false
			} as $WalletDocument
		} as EstimateTransactionFeeOptionsExtend, utxoSelector);
		expect(v).toBeGreaterThan(100);
	});

	it('should throw EW1', () => {
		expect(() => estimateTransactionSizeSync({
			address: '12',
			unspent: sets.a,
			value: sets.a.reduce((a,b) => a + Number(b.value), 0.0001),
			wallet: {
				scripttype: 'p2wsh',
				ismultisig: false
			} as $WalletDocument
		} as EstimateTransactionFeeOptionsExtend, utxoSelector)).toThrow('EW1');
	});
});
