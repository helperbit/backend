# Group User verification

Verifica dei documenti / posizione dell'utente.

## Verifications [GET /me/verify]
[x] Test script

Restituisce le informazioni delle verifiche.

+ Response 200 (application/json)

		{
			"mandatoryfields": ["fullname", "..."],
			"trustlevel": 3,
			"locked": false,
			"available": [
				"otc",
				"document"
			],
			"verification": [
				{
					provider: "manual|otc|mail|residency",
					level: 3,
					medias: [
						{ "name": "memorandum", "mid": "35234234" },
						{ "name": "actofboard", "mid": "34243242" }
					]
					info: { },
					submissiondate: "12 ago 15",
					responsedate: "12 ago 16",
					state: "submission|pending|inprogress|accepted|rejected",
					note: "Your name is different from document"
				}
			]
		}


+ Response 500 (application/json)

		{
			"error": "EV1", 
			"message": "incomplete profile", 
			"data": { 
				"fields": ["firstname"],
				"mandatoryfields": ["fullname", "..."]
			}
		}

+ Response 401 (application/json)

		{"error": "E1", "message": "you're not authenticated"}



## Verify a step [POST /me/verify/{provider}/step/{step}]
[x] Test script

Call per i vari step della verifica di un provider, dipendono dal provider e sono implementati in file separati. Lo step iniziale e' lo 0.

+ Parameters
	+ provider ... Provider
	+ step ... Step


+ Response 401 (application/json)

		{"error": "E1", "message": "you're not authenticated"}


+ Response 500 (application/json)

		{
			"error": "EV1", 
			"message": "incomplete profile", 
			"data": { 
				"fields": ["firstname"],
				"mandatoryfields": ["fullname", "..."]
			}
		}


+ Response 500 (application/json)

		{"error": "EV2", "message": "not available for your user type" }

+ Response 500 (application/json)

		{"error": "EV7", "message": "already pending verification" }


## Remove a verification [POST /me/verify/:provider/remove]
[ ] Test script

Rimuove una varifica gia' effettuata se esiste.

+ Response 200 (application/json)

		{}

+ Response 401 (application/json)

		{"error": "E1", "message": "you're not authenticated"}




## GPS verify [POST /me/verify/gps/step/0]
[x] Test script

Verifica tramite gps

+ Request Email set (application/json)

		{
			"lat": 39.9, 
			"lon": 9.9
		}

+ Response 200 (application/json)

		{}

+ Response 500 (application/json)

		{ "error": "EV5", "message": "position mismatch" }



## OTC verify (step 0) [POST /me/verify/otc/step/0]
[x] Test script

Primo step della verifica via OTC

+ Response 200 (application/json)

		{ }


## OTC verify (step 1) [POST /me/verify/otc/step/1]
[x] Test script

Secondo step della verifica via OTC; l'utente ha ricevuto la
lettera ed inserisce l'OTC.

+ Request Send OTC (application/json)

		{ "otc": "123" }

+ Response 200 (application/json)

		{ }

+ Response 500 (application/json)

		{ "error": "EV4", "message": "invalid OTC" }


		

## Mail verify [POST /me/verify/mail/step/0]
[x] Test script

Primo step della verifica via mail

+ Request Email set (application/json)

		{
			"email": "ong@ong.com"
		}

+ Response 200 (application/json)

		{}



## Residency verify [POST /me/verify/residency/step/0]
[x] Test script

Invio immagine del proof of residency

+ Response 200 (application/json)

		{}

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



## Documet verify (step 0) [POST /me/verify/document/step/0]
[x] Test script

Primo step della verifica document.

+ Request Document info (application/json)

		{
			"document": "id",
			"expirationdate": "15 ago 15",
			"documentid": "AS124543"
		}

+ Response 200 (application/json)

		{}

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


## Documet verify (step 1) [POST /me/verify/document/step/1]
[x] Test script

Invio immagine fronte o retro; classica richiesta per immagini. 


+ Request 200 (application/json)

		{ "name": "back|front" }

+ Response 200 (application/json)

		{}

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



## Documet verify (step 2) [POST /me/verify/document/step/2]
[x] Test script

Invia per la verifica

+ Response 200 (application/json)

		{}





## Npo statue verify [POST /me/verify/npostatute/step/0]
[x] Test script

Invio immagine dello statuto della NPO

+ Response 200 (application/json)

		{}

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


## Npo memorandum verify [POST /me/verify/npomemorandum/step/0]
[x] Test script

Invio immagine del verbale di assemblea della NPO

+ Response 200 (application/json)

		{}

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


## Npo admins verify 0 [POST /me/verify/npoadmins/step/0]
[x] Test script

Primo step della verifica npo.

+ Request (application/json)

		{
			"admins": [
				{
					"firstname": "Gianni",
					"lastname": "Gionni",
					"email": "gianni@gmail.com",
					"idnumber": "AD123424"
				},
				{
					"firstname": "Gianni",
					"lastname": "Gionni",
					"email": "gianni@gmail.com",
					"idnumber": "AD123424"
				},
				{
					"firstname": "Gianni",
					"lastname": "Gionni",
					"email": "gianni@gmail.com",
					"idnumber": "AD123424"
				}
			],
			"incharge": {
				"firstname": "Gianni",
				"lastname": "Gionni",
				"email": "gianni@gmail.com",
				"idnumber": "AD123424"
			}
		}


+ Response 200 (application/json)

		{}



## Npo admins verify 1 [POST /me/verify/npoadmins/step/1]
[x] Test script

Invio immagine del documento compilato

+ Response 200 (application/json)

		{}

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


## Npo admins verify 2 [POST /me/verify/npoadmins/step/2]
[x] Test script

Finalizza invio

+ Response 200 (application/json)

		{}
		



## Npo verify 0 [POST /me/verify/npo/step/0]
[ ] Test script

Primo step della verifica npo.

+ Request (application/json)

		{
			"refname": "",
			"reftel": "",
			"refmail": ""
		}

+ Response 200 (application/json)

		{}



## Npo verify 1 [POST /me/verify/npo/step/1]
[ ] Test script

Invio documenti


+ Request 200 (application/json)

		{ "name": "statute|memorandum|actofboard" }

+ Response 200 (application/json)

		{}


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



## Npo verify 2 [POST /me/verify/npo/step/2]
[ ] Test script

Finalizza invio

+ Response 200 (application/json)

		{}
		

