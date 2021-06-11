# Group Authentication

The helperbit authentication follows a bearer-token scheme by using JsonWebToken.

### Auth flow
The auth flow is the following:
1. The client signup with a POST to /api/v1/signup
2. The client login with a POST to /api/v1/login, sending credentials
3. The HB backend generate a new JWT for that user, signed with a private key. The token is
sent to the client as reply to /api/v1/login
4. The client can now use the received token to perform authenticated calls; the token should be injected
by the client as bearer token header ('authentication': 'bearer token').

In the private beta release, another header is required, called 'alphatoken'; the default is 'staff66'.

Some calls, require a captcha challenge using recaptcha (I'm not a robot version); the captcha response
code returned from google, should be sent as 'captcha' header.


## Create an account [POST /signup]
[x] Test script

Creation of a new user. After the signup, the backend send a mail to the user with an activation link.
This call require captcha challenge.


+ Request Create account with referral (application/json)
	+ Body

			{
				"username": "gianni", 
				"email": "gianni@gmail.com", 
				"password": "ultrasec!1!", 
				"terms": true, 
				"newsletter": true, 
				"usertype": "singleuser",
				"refby": "dagide91",
				"language": "it"
			}

+ Request Create account Singleuser (application/json)
	+ Body

			{
				"username": "gianni", 
				"email": "gianni@gmail.com", 
				"password": "ultrasec!1!", 
				"terms": true, 
				"newsletter": true, 
				"usertype": "singleuser",
				"language": "it"
			}


+ Request Create account NPO (application/json)
	+ Body

			{
				"username": "gianni", 
				"email": "gianni@gmail.com", 
				"password": "ultrasec!1!", 
				"terms": true, 
				"newsletter": true, 
				"usertype": "npo",
				"language": "it"
			}


+ Request Create account Municipality (application/json)
	+ Body

			{
				"username": "gianni", 
				"email": "gianni@gmail.com", 
				"password": "ultrasec!1!", 
				"terms": true, 
				"newsletter": true, 
				"usertype": "npo",
				"subtype": "municipality",
				"language": "it"
			}


+ Response 200 (application/json)
	+ Body

			{}

+ Response 500 (application/json)
	+ Body

			{"error": "ES1", "message": "username already taken"}

+ Response 500 (application/json)
	+ Body

			{"error": "ES2", "message": "email already registered"}

+ Response 500 (application/json)
	+ Body
	
			{"error": "E3", "message": "invalid parameters", "data": {"name": "fieldname", "reason": ""}}

+ Response 500 (application/json)
	+ Body

			{"error": "ES5", "message": "disposable email domain are not allowed"}


## Resend activation mail [POST /auth/activate/resend]
[ ] Test script

Resend the activation mail.

+ Request (application/json)
	+ Body

			{ "email": "" }

+ Response 200 (application/json)
	+ Body

			{}


## Activate account [POST /auth/activate]
[ ] Test script

Activate the account; this call is actually performed throught the link in the activation mail.

+ Request (application/json)
	+ Body

			{ "token": "", "email": "" }

+ Response 200 (application/json)
	+ Body

			{ }


+ Response 500 (application/json)
	+ Body

			{ "error": "EA1", "message": "invalid activation uri" }


## Logout [POST /logout]
[ ] Test script

Log out the logged user.

+ Response 200 (application/json)
	+ Body

			{}


## Login [POST /login]
[x] Test script

Login into an active account; the field user could be the signup email or username.
This call require captcha challenge.

+ Request Log into account with email (application/json)
	+ Body

			{ 
				"user": "gianni@gmail.com", 
				"password": "ultrasec!1!",
				"language": "it"
			}

+ Request Log into account with username (application/json)
	+ Body

			{ 
				"user": "gianni", 
				"password": "ultrasec!1!",
				"language": "it"
			}


+ Response 200 (application/json)
	+ Body

			{ 
				"token": "", 
				"expiration": 134234, 
				"username": "dagide91", 
				"email": "dagide91@gmail.com",
				"policyversion": {
					"accepted": {
						"terms": 2,
						"privacy": 2
					},
					"current": {
						"terms": 2,
						"privacy": 2
					}
				}
			}

+ Response 401 (application/json)
	+ Body

			{ "error": "EL1", "message": "wrong email / password combination" }


+ Response 401 (application/json)
	+ Body

			{ "error": "EA5", "message": "banned" }


+ Response 402 (application/json)
	+ Body

			{ "error": "EL3", "message": "your email address is not yet verified" }


+ Response 402 (application/json)
	+ Body

			{ "error": "EL2", "message": "you typed wrong credentials too many times; wait 5 minutes", "data": "lockexpiration" }


## Authentication status [GET /auth/state]
[x] Test script

Authentication state, check if the token is expired or not.

+ Response 200 (application/json)
	+ Body

			{"auth": "ok", "username": "username"}

+ Response 200 (application/json)
	+ Body

			{"auth": "none", "username": null}



## Password recovery [POST /auth/reset]
[ ] Test script

Send an email with a password recovery link.

+ Request Password reset (application/json)
	+ Body

			{ "email": "gessa@helperbit.com" }

+ Response 200 (application/json)
	+ Body

			{}

+ Response 500 (application/json)
	+ Body

			{ "error": "ER1", "message": "this email is not associated to any account" }

+ Response 500 (application/json)
	+ Body

			{"error": "ES4", "message": "password should be at least 8 character long"}


## Password change [POST /auth/change]
[ ] Test script

Change the password providing the old password, or providing a mail reset token.

+ Request Password change (application/json)
	+ Body

			{ "oldpassword": "ginopino", "newpassword": "ginopinolo" }


+ Request Password change with token (application/json)
	+ Body

			{ "token": "4fhu3fuf34if", "newpassword": "ginopinolo" }

+ Response 200 (application/json)
	+ Body

			{}

+ Response 500 (application/json)
	+ Body

			{"error": "ES4", "message": "password should be at least 8 character long"}

+ Response 500 (application/json)
	+ Body

			{"error": "ER2", "message": "invalid reset link"}


+ Response 500 (application/json)
	+ Body

			{"error": "ER3", "message": "expired reset link"}


+ Response 401 (application/json)
	+ Body

			{"error": "EL1", "message": "wrong email / password combination"}
