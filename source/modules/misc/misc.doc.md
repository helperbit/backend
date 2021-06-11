# Group Misc

## Search content [GET /search?q=text]
[ ] Test script

Search for content inside the platform, ordered by affinity.

+ Response 200 (application/json)

		{
			"results": [
				{
					"id": "username",
					"time": null,
					"type": "user",
					"mainInfo": "fullname / username",
					"secondaryInfo": "usertype",
					"tertiaryInfo": "country",
					"image": "avatar"
				},
				{
					"id": "id",
					"time": null,
					"type": "project",
					"mainInfo": { "it": "title", "en": "title" },
					"secondaryInfo": "owner",
					"tertiaryInfo": "country",
					"image": "media"
				},
				{
					"id": "txid",
					"time": null,
					"type": "donation",
					"mainInfo": "txid",
					"secondaryInfo": "destination",
					"tertiaryInfo": "value",
				}
			]
		}


## Platform info [GET /info]
[ ] Test script

Restitusice tutte le informazioni utili per far eseguire il widget:

+ Response 200 (application/json)

		{
			"blockchain": {
				"height": 34324324,
				"network": "mainnet|testnet"
			},
			"fees": { 
				"fastestFee": 50, 
				"halfHourFee": 30, 
				"hourFee": 20,
				"slowestFee": 50
			},
			"prices": {
				"usd": 378.911,
				"eur": 335.4976510860001,
				"cny": 2491.171967427,
				"jpy": 12343.231,
				"gbp": 120.342,
				"cad": 527.006848706,
				"rub": 30052.408621469,
				"btc": 1.0
			},
			"fiatdonation": {
				"available": 4.1432,
				"fixedcost": 0.25,
				"withdrawcost": 0.00050000,
				"fee": 3.5,
				"limits": {
					"btc": { "min": 0.005, "max": 0.06 },
					"eur": { "min": 5, "max": 250 }
				}
			},
			"flypme":{
				"enabled": true,
				"limits":{
					"BTC":{"max":"0.45351474","min":"0.00000454"},
					"LTC":{"max":"27.99473704","min":"0.00027995"},
					"PPC":{"max":"1177.68506064","min":"0.01177686"},
					"DOGE":{"max":"1007810.53333334","min":"10.07810534"},"DASH":{"max":"5.9480198","min":"0.00005949"},
					"BC":{"max":"7836.78486263","min":"0.07836785"},
					"GRC":{"max":"52795.66239814","min":"0.52795663"},
					"ETH":{"max":"6.33261087","min":"0.00006333"},
					"FAIR":{"max":"3473.87774799","min":"0.03473878"},"GAME":{"max":"1133.19192424","min":"0.01133192"},
					"ZEC":{"max":"8.54047773","min":"0.00008541"},
					"DCR":{"max":"59.88194859","min":"0.00059882"},
					"SYS":{"max":"9960.78936965","min":"0.0996079"},
					"FYP":{"max":"0.0","min":"0.2913001"}
				}
			}
		}


## Platform base info [GET /info/base]
[ ] Test script

Restitusice le informazioni base utili per far eseguire il frontend:

+ Response 200 (application/json)

		{
			"blockchain": {
				"network": "testnet"
			},
			"fees": {
				"fastestFee": 20,
				"halfHourFee": 20,
				"hourFee": 10,
				"slowestFee": 5
			},
			"prices": {
				"btc": 1,
				"eur": 7223.11,
				"usd": 8577.843913216731,
				"cny": 62513.09,
				"gbp": 6362.019361182055,
				"jpy": 941353.0000000049,
				"rub": 531937.9062622944,
				"cad": 11096.877990616844
			},
			"fiatdonation": {
				"available": 0,
				"fixedcost": 0.25,
				"fee": 3.5,
				"limits": {
					"btc": {
						"min": 0.00151,
						"max": 0.1
					},
					"eur": {
						"min": 5,
						"max": 250
					}
				},
				"withdrawcost": 0.0001
			},
			"flypme": {
				"enabled": false,
				"limits": {}
			},
			"policyversion": {
				"terms": 2,
				"privacy": 2
			}
		}

## Send a feedback [POST /feedback]
[ ] Test script

Invia un feedback riguardante la piattaforma. Puo' includere
un immagine inclusa come multiform.
Puo' anche non contenere un email nel caso l'utente sia loggato.

+ Request Feedback (application/json)

		{
			"email": "",
			"description": ""
		}


+ Request Feedback logged (application/json)

		{
			"description": "Lorem ipsum..."
		}


+ Response 200 (application/json)

		{ }

+ Response 500 (application/json)

		{ "error": "E", "message": "generic error" }



## Subscribe to the newsletter [POST /subscribe]
[ ] Test script

Subscribe to the Helperbit mailchimp newsletter

+ Request Subscribe with email (application/json)

		{
			"email": "gianni@gmail.com",
			"username": "gianni"
		}

+ Request Subscribe with email (application/json)

		{
			"email": "gianni@gmail.com",
		}


+ Response 200 (application/json)

		{ }

+ Response 500 (application/json)

		{ "error": "E", "message": "generic error" }

+ Response 500 (application/json)

		{ "error": "E3", "message": "invalid parameters" }



## Send a contact email [POST /contact]
[ ] Test script

Contact helperbit

+ Request Contact (application/json)

		{
			"email": "gianni@gmail.com",
			"firstname": "Davide",
			"lastname": "Gessa",
			"subject": "Non funziona nulla :(",
			"message": "dakk pensaci tu!"
		}


+ Request Contact minimal fields (application/json)

		{
			"email": "gianni@gmail.com",
			"subject": "Non funziona nulla :(",
			"message": "dakk pensaci tu!"
		}

+ Response 200 (application/json)

		{ }

+ Response 500 (application/json)

		{ "error": "E", "message": "generic error" }

+ Response 500 (application/json)

		{ "error": "E3", "message": "invalid parameters" }



## Last blog post [GET /blog]
[ ] Test script

Return latest blogpost in json format

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/blog.json) -->
