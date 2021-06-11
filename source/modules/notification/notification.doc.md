# Group User notifications

## List [GET /me/notifications]
[ ] Test script

Return notifications of the logged user, sorted by date and by read status 
(first notifications are unread notifications).

+ Response 200 (application/json)

		{
			"unread": 2,
			"notifications": [
				{
					"_id": "1223hfyu4f",
					"time": "343283",
					"code": "324324123",
					"unread": true,
					"redirect": "/me/wallet"
				},
				{
					"_id": "1223hfyu4f",
					"time": "343283",
					"code": "324324123",
					"unread": true,
					"data": { "from": "gianni" },
					"redirect": "/me/wallet" }
			]
		}




## Remove [DELETE /me/notification/:id]
[ ] Test script

Set a notification as read. If the notification can't be removed (permanent) or if it is not present, 
it returns a 500.

