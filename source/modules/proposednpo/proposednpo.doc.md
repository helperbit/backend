# Group Proposed NPO
This feature allows user to insert and endorse the signup of an NPO inside helperbit.


## List proposals [GET /proposednpo]
[ ] Test script

Return the list of proposed NPOs, sorted by endorsment number. The request could include a GET parameter ?query=abc to provide autocompletation features.

+ Response 200 (application/json)

			{
				"proposednpo": [
					{
						"name": "Croce Rossa Italiana",
						"link": "http://crocerossa.com",
						"endorsment": 123,
						"country": "ITA"
					}
				]
			}



# Propose an organization [POST /proposednpo/insert]
[x] Test script

Insert a new NPO; the NPO is not directly included in the list because an admin should validate it.


+ Request Insert NPO (application/json)

			{
				"country": "ITA",
				"name": "Croce Rossa Italiana",
				"link": "http://crocerossa.com"
			}


+ Response 500 (application/json)

			{ "error": "EMWN3", "message": "organization already proposed" }

+ Response 500 (application/json)

			{ "error": "E3", "message": "invalid parameters" }

+ Response 200 (application/json)

			{}



## Endorse a proposal [POST /proposednpo/:id/endorse]
[ ] Test script

Endorse an NPO in the list. If the user already endorsed this NPO or if its IP already endorsed this
NPO, the endorsment is not counted.

+ Response 200 (application/json)

		{ 
			"endorsment": 123 
		}


+ Response 500 (application/json)

		{ 
			"error": "EMWN1", 
			"message": "your IP has already endorsed this NPO" 
		}


+ Response 500 (application/json)

		{ 
			"error": "EMWN2", 
			"message": "you has already endorsed this NPO" 
		}


