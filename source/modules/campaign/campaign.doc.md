Campaign are crowdfunding for an npo or an npo project created from a singleuser.


# GET /campaign/:id
[ ] Test script

Return informations about a single campaign given its id.

- received: received amount in BTC
- receivedconverted: received amount, but in "currency"
- receiveddonations: number of received donations

+ Response 200 (application/json)

		{
			"owner": "gianni",
			"ownerdetails": {
				"fullname": "Lollo",
				"usertype": "singleuser",
				"username": "gianni",
			},
			"title": "Mondo",
			"description": "Ciao",
			"target": 200,
			"currency": "EUR",
			"resource": "PROJECTID",
			"end": "ENDDATE",
			"start": "STARTDATE",
			"status": "started|concluded",
			"type": "project",
			"resource": "PROJECTID",

			"received": 0.08,
			"receivedconverted": 100,
			"receiveddonations": 3,
			"percentage": 50
		}


+ Response 404 (application/json)

		{"error": "E2", "message": "resource not found"}


# GET /campaign/:id/giftmessages
[ ] Test script

Returns messages from donations of the campaign, only to the campaign owner.

+ Response 200 (application/json)

		{
			"messages": [
				{
					"message": "Ciao pino, auguri!",
					"name": "Gianny"
				}
			]
		}


# POST /campaign/create
[ ] Test script

Create a new empty campaign.

+ Request New campaign (application/json)

		{
			"title": "Mondo",
			"description": "Ciao",
			"target": 200,
			"currency": "EUR"
		}

+ Response 200 (application/json)

		{ "id": "55acf85c9c6cf363703700ad" }

+ Response 401 (application/json)

		{"error": "E6", "message": "not authorized"}

+ Response 500 (application/json)

		{"error": "EC1", "message": "you already have a running campaign"}

+ Response 500 (application/json)

		{"error": "EC5", "message": "above max target", "data": { "max": { "currency": "EUR", "amount": 1120 }}}

+ Response 500 (application/json)

		{"error": "EC3", "message": "campaign info are not yet completed"}

+ Response 500 (application/json)

		{"error": "EC4", "message": "invalid resource"}


# POST /campaign/:id/edit
[ ] Test script

Edit a campaign.

+ Request Edit a campaign (application/json)

		{
			"title": "Mondo",
			"description": "Ciao",
			"target": 200,
			"currency": "EUR",
			"resource": "PROJECTID",
			"end": "ENDDATE"
		}

+ Response 200 (application/json)

		{ }

+ Response 401 (application/json)

		{"error": "E6", "message": "not authorized"}

+ Response 500 (application/json)

		{"error": "EC5", "message": "above max target", "data": { "max": { "currency": "EUR", "amount": 1120 }}}

+ Response 500 (application/json)

		{"error": "EC6", "message": "can't edit a concluded campaign"}

+ Response 500 (application/json)

		{"error": "EC3", "message": "campaign info are not yet completed"}

+ Response 500 (application/json)

		{"error": "EC4", "message": "invalid resource"}


# POST /campaign/:id/delete
[ ] Test script

Eliminazione di un campaign esistente. Se pero' include gia' donazioni, non puo' essere rimosso.

+ Response 200 (application/json)

		{}

+ Response 401 (application/json)

		{"error": "E6", "message": "not authorized"}

+ Response 500 (application/json)

		{"error": "EC2", "message": "can't delete a running campaign"}



# POST /campaign/:id/media
[ ] Test script

Setta l'immagine alla campagna. Il file deve essere inviato con richiesta multipart, deve essere 
immagine e non deve superare i 2097152 bytes di dimensione.

+ Response 200 (application/json)

		{ "id": "55acf85c9c6cf363703700ad" }

+ Response 500 (application/json)

		{
			"error": "EM1",
			"message": "invalid format",
			"data": { "supported": ["image"] }


# POST /campaign/:id/media/remove
[ ] Test script

Rimuove l'immagine della campagna 

+ Response 200 (application/json)

		{  }


# GET /me/campaigns
[ ] Test script

Return campaigns of the logged user.

+ Response 200 (application/json)

		{
			"campaigns": [
				{
					"title": "Mondo",
					"description": "Ciao",
					"target": 200,
					"currency": "EUR",
					"end": "ENDDATE",
					"start": "STARTDATE",
					"status": "started|concluded",
					"type": "project",
					"resource": "PROJECTID",

					"received": 0.08,
					"receivedconverted": 100,
					"receiveddonations": 3,
					"percentage": 50
				}
			]
		}