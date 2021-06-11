# GET /me/rors/tolist
[x] Test script

Return the list of user that the current user can use to request a ROR.

+ Response 200 (application/json)

		{
			"users": [
				{ "username": "", "usertype": "", "fullname": "" }
			]
		}


# POST /user/:name/ror
[x] Test script

Request funds to the given user. The user should be an NPO while
the requester should be an NPO or a Company.

The request also contains a pdf or image as proof of spent.

+ Request (application/json)
	
		{ 
			"value": 150.0, 
			"currency": "eur", 
			"description": "", 

			"invvat": "1342432",
			"invdate": "12 october 2016"
		}


+ Response 200 (application/json)

		{ 
			"rid": "12342342341"
		}

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

		
# GET /ror/:id
[x] Test script

Permette a chiunque di vedere una singola ror.


+ Response 200 (application/json)

		{ 
			"_id": "",
			"status": "",
			"from": "eticheterre",
			"to": "legambiente",

			"receiveaddress": "",
			"value": 12,
			"currency": "eur"

			"description": "",
			"documents": [],
			"hash": "124234234",

			"invvat": "1342432",
			"invdate": "12 october 2016",

			"time": ""
		}


# GET /me/rors
# GET /user/:name/rors
[x] Test script

Return the list of interested RORs for the user.

+ Request (application/json)
	
		{ 
			"reason": "value too large"
		}


+ Response 200 (application/json)

		{ 
			"rors": [
				{
					"_id": "",
					"status": "",
					"from": "eticheterre",
					"to": "legambiente",

					"receiveaddress": "",
					"value": 12,
					"currency": "eur"

					"description": "",
					"documents": [],
					"hash": "124234234",

					"invvat": "1342432",
					"invdate": "12 october 2016",

					"time": ""
				}
			]
		}


# DELETE /me/ror/:rid
[ ] Test script

Delete a waiting ROR created by the calling user.


# POST /me/ror/:rid/reject
[x] Test script

Reject a pending ROR

+ Response 200 (application/json)

		{ }