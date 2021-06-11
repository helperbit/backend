# Group Authentication social

## Edit login data [POST /auth/social/edit]
[ ] Test script

Modifica i dati email e password di utente registrato tramite social.

+ Request (application/json)
	+ Body

			{
				"email": "gianni@fenu.com",
				"password": "3543432432"
			}

+ Response 200 (application/json)
	+ Body

			{}



## Login using social [/auth/social/:provider/login]

### Get login url [GET]
[ ] Test script

Request the login url for the social account defined by :provider.

+ Response 200 (application/json)
	+ Body

			{ "url": "facebook.com/.../...?..." }


### Inject login token [POST]
[ ] Test script

The previously described login url, redirect the user to the social network; after the acceptance
of the helperbit app, the user is redirected to helperbit then helperbit save the social association.

If this call is called by an unauthenticated user, it allows to login to your helperbit account
previously associated with a social account, returning a bearer token (like login).


+ Request Token code for facebook (application/json)
	+ Body

			{
				"code": "342fnij3u4ff23pf"
			}

+ Request Token code for twitter (application/json)
	+ Body

			{
				"code": "342fnij3u4ff23pf",
				"requesttoken": "23432"
			}


+ Response 200 (application/json)
	+ Body

			{
                "id": "userid"
            }


+ Response 200 (application/json)
	+ Body

			{
                "id": "userid", 
                "token": "325484f3uijn", 
                "username": 
                "dagide", 
                "expiration": 235234
            }


+ Response 500 (application/json)
	+ Body

			{}

+ Response 401 (application/json)
	+ Body

			{ 
                "error": "EA2", 
                "message": "an account is already associated to this social id" 
            }

