# Group User ambassador

## User referrals [GET /me/ambassador]
[x] Test script

Return useful informations about referred users.

+ Response 200 (application/json)

		{
			"refby": "gessa",
			"referred": [
				{ "regdate": "12/12/12", "verified": false },
				{ "regdate": "12/12/12", "verified": true },
			],
			"count": 1
		}


## Top ambassadors [GET /stats/topambassadors/:timeframe]
[ ] Test script

Return a list of top ambassadors for different timeframes; timeframe should be "day", "week", "month", "3month", "year" or "ever".

+ Response 200 (application/json)

		{
			"topambassadors": [{
				"count": 2,
				"user": "gianni"
			}, {
				"count": 1,
				"user": "matteo"
			}]
		}



## Merchandise status [GET /stats/merchandise]
[ ] Test script

Returns the available merchandise objects. If the user is logged and
an object is assigned to the logged users, assigment is != null.

+ Response 200 (application/json)

		{
			"merchandise":[
				{
					"assigned":0,
					"time":"2018-10-24T09:50:34.869Z",
					"name":"keychain",
					"total":21,
					"minrefs":5,
					"assignment": {
						"status": "assigned|delivering|delivered",
						"time":"2018-10-24T09:50:34.869Z"
					}
				},
				{
					"assigned":0,
					"time":"2018-10-24T09:50:34.874Z",
					"name":"tshirt",
					"total":21,
					"minrefs":15
				},
				{
					"assigned":0,
					"time":"2018-10-24T09:50:34.874Z",
					"name":"sweatshirt",
					"total":21,
					"minrefs":35
				},
				{
					"assigned":0,
					"time":"2018-10-24T09:50:34.874Z",
					"name":"ledger",
					"total":21,
					"minrefs":100
				}
			]
		}