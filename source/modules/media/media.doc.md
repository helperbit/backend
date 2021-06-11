# GET /media/:id
[ ] Test script

Return the image data given its id. If the media is private, only the owner can see it. 

+ Response 404 (application/json)

		{"error": "E2", "message": "resource not found"}


# GET /m/:id/t/:text*
[ ] Test script

Return the image data given its id and additional discarded text

# GET /media/:id/thumbnail
[ ] Test script

Return the image scaled preview data given its id. If the media is private, only the owner can see it.

+ Response 404 (application/json)

		{"error": "E2", "message": "resource not found"}

# GET /m/:id/thumbnail/t/:text*
[ ] Test script

# GET /media/:id/thumbnail/:size
[ ] Test script

Return the image scaled preview data given its id. If the media is private, only the owner can see it.

+ Response 404 (application/json)

		{"error": "E2", "message": "resource not found"}


# GET /m/:id/thumbnail/:size/t/:text*
[ ] Test script

# GET /media/:id/type
[ ] Test script

Return the content type of a media.

+ Response 200 (application/json)

		{ "type": "image/png" }

+ Response 200 (application/json)

		{ "type": "application/pdf" }