# Group Organization administration

## Admin list [GET /me/admin]
[x] Test script

Restituisce la lista degli admin dell'organizzazione.

+ Response 200 (application/json)

		{
			"adminsusers": [
				{
					"email": "gino@gmail.com",
					"username": "pino",
					"trustlevel": 12
				}
			],
			"allowedadmins": [],
			"admins": [
				"email@gmail.com",
				"email2@gmail.com"
			]
		}

## Add an admin [POST /me/admin/add]
[x] Test script

Aggiunge un admin all'organizzazione

+ Request (application/json)

		{ "email": "gianni@gmail.com" }

+ Response 200 (application/json)

		{ }

+ Response 404 (application/json)

		{ "error": "E2", "message": "resource not found"}

+ Response 500 (application/json)

		{ "error": "EA3", "message": "account not active" }

+ Response 500 (application/json)

		{ "error": "EA4", "message": "admin not allowed" }


## Remove an admin [POST /me/admin/remove]
[x] Test script

Rimuove un utente dagli admin

+ Request (application/json)

		{ "email": "gianni@gmail.com" }

+ Response 500 (application/json)

		{ "error": "EW13", "message": "this admin belong to a wallet" }

+ Response 200 (application/json)

		{ }
