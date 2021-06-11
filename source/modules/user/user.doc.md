# Group User

## User profile [/me]

### Get profile [GET]
[x] Test script

Return informations about the logged user.

+ Response 200 (application/json)

		<!-- include(../docs.shared/body/me_single.json) -->

+ Response 200 (application/json)

		<!-- include(../docs.shared/body/me_company.json) -->

+ Response 200 (application/json)

		<!-- include(../docs.shared/body/me_npo.json) -->

+ Response 200 (application/json)

		<!-- include(../docs.shared/body/me_npo2.json) -->

+ Response 401 (application/json)

		{"error": "E1", "message": "you're not authenticated"}


### Edit profile [POST]
[x] Test script

Allow the user to edit personal profile fields; if a field related to location (country, city, region, street) is
updated, then the backend also set the location field using google reverse geocoding.

+ Request Modifica di campi utente (application/json)

		{
			"firstname": "Gianni",
			"lastname": "Giangiacomo",
			"language": "it",
			"publicfields": [ "firstname", "lastname" ]
		}

+ Response 401 (application/json)

		{ "error": "E1", "message": "you're not authenticated" }

+ Response 500 (application/json)

		{ "error": "EV3", "message": "locked fields not editable" }
		
+ Response 500 (application/json)

		{ "error": "EU1", "message": "can't geolocalize in the sea" }
		
+ Response 500 (application/json)

		{ "error": "EU2", "message": "invalid address" }



## Remove avatar [DELETE /me/media/avatar]
[ ] Test script

+ Response 200 (application/json)

		{}
		

## Change avatar [POST /me/media/avatar]
[x] Test script

Update the user avatar. The file should be sent as a multipart, should be an image/*,
and can't exceed 2097152 bytes.


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


## Remove cover photo [DELETE /me/media/photo]
[ ] Test script

+ Response 200 (application/json)

		{}


## Change cover photo [POST /me/media/photo]
[x] Test script

Update the NPO cover photo. The file should be sent as a multipart "image/*" and can't exceed 2097152 bytes.


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




## Events intersecting the user [GET /me/events]
[ ] Test script

Return the list of events which intersect the user by country/countries.

+ Response 200 (application/json)

		{
			"events": [
				{ ... },
				{ ... },
				{ ... }
			]
		}


## Events intersecting an user [GET /user/:name/events]
[ ] Test script

Return the list of events which intersect the user country / countries.

+ Response 200 (application/json)

		{
			"events": [
				{ ... },
				{ ... },
				{ ... }
			]
		}



## Get the avatar [GET /me/avatar]
[ ] Test script

Get the avatar of the user

		
## Get the avatar of an user [GET /user/:name/avatar]
[ ] Test script

Get the avatar of the user


## Get the avatar of an user [GET /user/:name/avatar/:text*]
[ ] Test script

Get the avatar of the user



## Get an user profile [GET /user/:name]
[ ] Test script

Return public information of an helperbit user given its username.

+ Response 200 (application/json)

		<!-- include(../docs.shared/body/user_public_npo.json) -->

+ Response 200 (application/json)

		<!-- include(../docs.shared/body/user_public_singleuser.json) -->

+ Response 404 (application/json)

		{"error": "E2", "message": "resource not found"}


## Get npo completness [GET /me/npostatus]
[ ] Test script

Return 200 if the status is complete, E8 otherwise.


## Get user geoquads [GET /users/geoquad/{usertype}]
[ ] Test script

+ Parameters
	+ usertype (optional) ... Filter by usertype (ie: singleusers)

Return the non-empty geoquad polygons of users; this is useful for visualizing heatmap and density map.
Min and max indicate which is the min and max values in cells, faciliting the client-side heat algorithm.
Count is the total number of users.

NB: this call always return data, even empty.

+ Response 200 (application/json)

		{
			"min": 1,
			"max": 5,
			"count": 125,
			"features": []
		}


## Organization list [/organizations/list]
Return the list of organization.

### List [GET]
[ ] Test script

+ Response 200 (application/json)

		{
			"organizations": [
				{ },
				{ }
			],
			"count": 12
		}


### Paginated list [POST]
[ ] Test script

+ Request Pagination (application/json)

		{
			"page": 2,
			"limit": 50,
			"orderby": "fullname|operators|receiveddonations|country",
			"name": "ca",
			"sort": "asc|desc"
		}


+ Response 200 (application/json)

		{
			"organizations": [
				{ },
				{ }
			],
			"count": 12
		}
