# Group Statistics

## Generic statistics [GET /stats]
[ ] Test script

Return generic statistic about the platform.

+ Response 200 (application/json)

		{
			"events": 125235,
			"users": 453567345,
			"projects": 234,
			"organizations": 124324,
			"donations": 6238278235
		}


## Topdonors in a timeframe [GET /stats/topdonors/:timeframe]
[x] Test script

Return a list of 20 top donors for different timeframes; timeframe should be "day", "week", "month",
"3month", "year" or "ever"

+ Response 200 (application/json)

		{
			"topdonors": [
				{
					"user": null,
					"country": "ITA",
					"n": 5,
					"address": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsA",
					"volume": 3.21
				},
				{
					"user": "guido",
					"country": "ITA",
					"n": 5,
					"address": "mqw8Pt7N4BbjjfBW551UT5erRweQdeiJsZ",
					"volume": 2.67
				}
			]
		}

## Last achieved badges [GET /stats/lastbadges?limit=10]
[ ] Test script

Return the list of last obtained badges in the platform sorted desc by time.

+ Response 200 (application/json)

		{
			"lastbadges": [
				{ "code": "fundraiser-silver", "time": "12/12/12", "user": "dakk" },
				{ "code": "trust", "time": "12/12/12", "user": "mcalvani" }
			]
		}

## Social stats [GET /stats/social]
[ ] Test script

Return social stats.

+ Response 200 (application/json)

		{ "twitter": 4535, "facebook": 623423 }


## World stats [GET /stats/world]
[ ] Test script

Return world statistics, one object for each country (WRL contains aggregated statistics).

+ Response 200 (application/json)

		{
			"WRL": {
				"users": 1200304234,
				"organizations": 124324,
				"onlineusers": 1034,
				"projects": 234,
				"events": 12,
				"received": 15432343.123423,
				"receiveddonations": 4543234
				"donated": 134543.12432,
				"donateddonations": 342,
				"topfivedonated": [ { "country": "ITA", "volume": 12 } ],
				"topfivereceived": [ { "country": "ITA", "volume": 12 } ],
				"history": [
					{
						"start": "timestamp",
						"received": 15432343.123423,
						"receiveddonations": 4543234
						"donated": 134543.12432,
						"donateddonations": 342
					}
				]
			},
			"ITA": {
				"users": 1200304234,
				"organizations": 124324,
				"onlineusers": 1034,
				"projects": 234,
				"events": 1,
				"received": 15432343.123423,
				"receiveddonations": 4543234
				"donated": 134543.12432,
				"donateddonations": 342,
				"topfivedonated": [ { "country": "ITA", "volume": 12 } ],
				"topfivereceived": [ { "country": "ITA", "volume": 12 } ],
				"history": [
					{
						"start": "timestamp",
						"received": 15432343.123423,
						"receiveddonations": 4543234
						"donated": 134543.12432,
						"donateddonations": 342
					}
				]
			},
			"united states of america": {
				...
			}, ...
		}




## Stats by country [GET /stats/country/:country]
[ ] Test script

Return country statistics.

+ Response 200 (application/json)

		{
			"users": 1200304234,
			"organizations": 124324,
			"onlineusers": 1034,
			"projects": 234,
			"events": 1,
			"received": 15432343.123423,
			"receiveddonations": 4543234
			"donated": 134543.12432,
			"donateddonations": 342,
			"topfivedonated": [ { "country": "ITA", "volume": 12 } ],
			"topfivereceived": [ { "country": "ITA", "volume": 12 } ],
			"history": [
				{
					"start": "timestamp",
					"received": 15432343.123423,
					"receiveddonations": 4543234
					"donated": 134543.12432,
					"donateddonations": 342
				}
			]
		}


## Stats by country, short way [GET /stats/country/:country/short]
[ ] Test script

Return country statistics.

+ Response 200 (application/json)

		{
			"users": 1200304234,
			"organizations": 124324,
			"onlineusers": 1034,
			"projects": 234,
			"events": 1,
			"received": 15432343.123423,
			"receiveddonations": 4543234
			"donated": 134543.12432,
			"donateddonations": 342
		}
