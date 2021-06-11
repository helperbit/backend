# GET /blockchain/fees
[x] Test script

Restituisce le recommanded fees di https://bitcoinfees.21.co/

+ Response 200 (application/json)

		{ "fastestFee": 50, "halfHourFee": 30, "hourFee": 20, "slowestFee": 50 }


# GET /blockchain/prices
[x] Test script

Restituisce il prezzo di cambio medio da bitcoin a fiat.

+ Response 200 (application/json)

		{
		    "usd": 378.911,
		    "eur": 335.4976510860001,
		    "cny": 2491.171967427,
			"jpy": 12343.231,
			"gbp": 120.342,
		    "cad": 527.006848706,
		    "rub": 30052.408621469,
		    "btc": 1.0
		}


# POST /blockchain/rawtransactions
[ ] Test script

+ Request (application/json)

		{
			"hashses": ["txid"]
		}

+ Response 200 (application/json)

		{
			"txid": "rawtxdata"
		}