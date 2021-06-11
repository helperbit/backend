Project are created by NPOs; projects are activities which give an help to a community.
A project can be associated to an event or to a set of involved countries.

# GET /projects/home
[ ] Test script

Return the list of project to be shown in homepage. If the user is logged, closetome
contains projects near the user position.


+ Response 200 (application/json)

		{
			"trending": [],
			"latest": []
		}		


# GET /project/:id
[x] Test script

Return informations about a single project given its id.

Fields named received, used, pending, target has the following meaning:
- target: value in "currency" (EUR/USD) to reach for project completation
- received: total Bitcoin received
- used: value in "currency" (EUR/USD) already used by the organization owning the project (the value is fixed to the change of the time they used the BTC)
- pending: total Bitcoin received minus the Bitcoin used

So the percentage of completation of the project is: 
complet = used + pending * btcprice[currency]
completpercentage = complet * 100 / target


+ Response 200 (application/json)

		{
			"_id": "",
			"owner": "dakk",
			"ownerdetails": {
				"fullname": "Davide Gessa"
			},
			"status": "approved",
			"event": "idevent|null",
			"paused": false,

			"start": "",
			"end": "",
			"title": { 
				"en": ""
			},
			"description": { 
				"en": ""
			},
			"tags": ["education"],

			"media": ["mediaid", "videolink"],
			"video": ["url1", "url2"],
			"activities": [ {
				"_id": "5435345234235234",
				"title": { "en": "Build a school"},
				"description": { "en": "hello world" },
				"media": [ "542432423423423112345" ],
				"createdAt": "12/32/1001",
				"category": "update"
			],

			"target": 1500,
			"currency": "EUR",

			"received": 1.324,
			"used": 1500,
			"pending": 0.324,
			"receiveddonations": 12,

			"receiveaddress": "1XNassad",
			"supporters": [
				{
					"user": "gianni",
					"link": "gianni.it",
					"level": 5
				}
			]
		}


+ Response 404 (application/json)

		{"error": "E2", "message": "resource not found"}



# GET /projects
[ ] Test script

Return all projects.

	+ Response 200 (application/json)

		{
			"projects": [
				{ },
				{ }
			]
		}

# /projects/list
Return the project list.

# GET
[ ] Test script

	+ Response 200 (application/json)

		{
			"projects": [
				{ },
				{ }
			],
			"count": 1
		}


# POST
[ ] Test script

+ Request Filter by title (application/json)

		{
			"title": "ciao"
		}

		

+ Request Filter by tags (application/json)

		{
			"tags": ["cultural"]
		}

		

+ Request Pagination (application/json)

		{
			"page": 2,
			"limit": 50,
			"orderby": "start|owner|title|received",
			"sort": "asc|desc"
		}

+ Request Pagination with tag filters (application/json)


		{
			"page": 2,
			"limit": 50,
			"orderby": "start|owner|title|received",
			"sort": "asc|desc",
			"tags: ["education"]
		}


+ Response 200 (application/json)

		{
			"projects": [
				{ },
				{ }
			],
			"count": 1
		}



# POST /project/create
[x] Test script

Create a new project. An user can create only one project alla volta.

+ Request New project (application/json)

		{
			"title": { "en": ""},
			"description": { "en": ""},
			"target": 0.1,
			"currency": "EUR",
			"receiveaddress": "1A43523423435234"
		}

+ Response 200 (application/json)

		{ "id": "" }

+ Response 401 (application/json)

		{"error": "E6", "message": "not authorized"}

+ Response 500 (application/json)

		{"error": "EP1", "message": "wrong wallet selected"}





# POST /project/:id/submit
[x] Test script

Modifica lo stato del progetto da draft a submitted, in attesa che un admin lo convalidi.

+ Request (application/json)

		{}


+ Response 200 (application/json)

		{}


# POST /project/:id/edit
[x] Test script

Modifica di un progetto esistente.
I progetti possono essere associati ad un "evento" che ricade negli stati controllati dalla organizzazione tramite questa call;
un evento puo' essere associato ad un solo progetto della stessa organizzazione.


+ Request New project (application/json)

		{
			"field": "value"
		}

+ Response 401 (application/json)

		{"error": "E6", "message": "not authorized"}


+ Response 500 (application/json)

		{"error": "EP2", "message": "this event is already associated with one of your projects"}


+ Response 500 (application/json)

		{"error": "EP3", "message": "this event is not in your organization area"}

+ Response 500 (application/json)

		{"error": "EP1", "message": "wrong wallet selected"}




# POST /project/:id/delete
[x] Test script

Eliminazione di un progetto esistente. Se pero' include gia' donazioni, non puo' essere rimosso.

+ Response 200 (application/json)

		{}

+ Response 401 (application/json)

		{"error": "E6", "message": "not authorized"}

+ Response 500 (application/json)

		{"error": "EP6", "message": "project has donations"}



# POST /project/:id/media/:mid/remove
[x] Test script

Rimuove un media dato id

+ Request Remove (application/json)

		{}

+ Response 200 (application/json)

		{ }


# POST /project/:id/media
[x] Test script

Aggiunge un media al progetto. Il file deve essere inviato con richiesta multipart, deve essere 
immagine e non deve superare i 2097152 bytes di dimensione.

+ Response 200 (application/json)

		{ "id": "55acf85c9c6cf363703700ad" }

+ Response 500 (application/json)

		{
			"error": "EM1",
			"message": "invalid format",
			"data": { "supported": ["pdf", "image"] }
		}	

+ Response 500 (application/json)

		{
			"error": "EM2",
			"message": "file is above max size",
			"data": { "value": 20489 }
		}


+ Response 500 (application/json)

		{ "error": "EP8", "message": "too many media" }


# GET /event/:id/projects
[ ] Test script

Return projects of an event.

+ Response 200 (application/json)

		{
			"projects": [
				{ },
				{ }
			],
			"closedprojects": [
				{ },
				{ }
			]
		}


# GET /user/:name/projects
[ ] Test script

Return projects of an user.

+ Response 200 (application/json)

		{
			"projects": [
				{ },
				{ }
			],
			"closedprojects": [
				{ },
				{ }
			]
		}



# GET /me/projects
[ ] Test script

Return projects of the logged user.

+ Response 200 (application/json)

		{
			"projects": [
				{ },
				{ }
			],
			"closedprojects": [
				{ },
				{ }
			]
		}


## Group Project activities

# POST /project/:id/activity/new
[x] Test script

Create a new activity

+ Request New (application/json)

		{
			"title": { "en": "hello world" },
			"description": { "en": "hello world" },
			"category": "update"
		}

+ Response 200 (application/json)

		{ "id": "342523432435435234" }


# POST /project/:id/activity/:aid/edit
[x] Test script 

Edit an activity

+ Request Edit (application/json)

		{
			"title": { "en": "hello world" },
			"description": { "en": "hello world" },
			"category": "update"
		}

+ Response 200 (application/json)

		{ "id": "342523432435435234" }


# POST /project/:id/activity/:aid/remove
[x] Test script 

Remove an activity

+ Request Remove (application/json)

		{ }

+ Response 200 (application/json)

		{ }
	

# POST /project/:id/activity/:aid/media
[x] Test script

Add a media

+ Response 200 (application/json)

		{ "id": "3424234234" }

+ Response 500 (application/json)

		{
			"error": "EM1",
			"message": "invalid format",
			"data": { "supported": ["pdf", "image"] }
		}	

+ Response 500 (application/json)

		{
			"error": "EM2",
			"message": "file is above max size",
			"data": { "value": 20489 }
		}


# POST /project/:id/activity/:aid/media/:mid/remove
[x] Test script

Remove a media

+ Response 200 (application/json)

		{}


