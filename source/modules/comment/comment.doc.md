Funzionalita' riguardanti i commenti.


# GET /event/:id/comments
# GET /project/:id/comments
# GET /user/:id/comments
[ ] Test script

Restituisce una lista di commenti per la data risorsa; restituisce anche i commenti dell'utente
non ancora approvati.

+ Response 200 (application/json)

		{
			"comments": [
				{
					"text": "commento di prova",
					"time": "12 april 2017 15:53",
					"user": "dagide",
					"approved": false
				},
				{
					"text": "commento di prova",
					"time": "12 april 2017 15:53",
					"user": "dagide2",
					"approved": true
				}
			]
		}



# POST /event/:id/comment/add
# POST /project/:id/comment/add
# POST /user/:id/comment/add
[ ] Test script

Aggiunge un commento

+ Request Add (application/json)

		{
			"text": "Testo di prova"
		}

+ Response 200 (application/json)

		{
			"_id": "325435214234234"
		}


# POST /event/:id/comment/:cid/remove
# POST /project/:id/comment/:cid/remove
# POST /user/:id/comment/:cid/remove
[ ] Test script

Rimuove un commento

+ Request Remove (application/json)

		{ }

+ Response 200 (application/json)

		{ }

