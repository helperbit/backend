# GET /events/home
[x] Test script

Return main event that should be show in the homepage; if the user is logged, the closetome field
contains events near the user position (if any).

+ Response 200 (application/json)

		{
			"main": [
				{}
			],
			"closetome": [
				{}
			]
		}		


# GET /events/all
[ ] Test script

Return all events, only epicenter, countries, event type and magnitude.

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/events_all.json) -->




# /events/list

Return the event list; this call unwind the single shakes contained in the event, so an event
with two shakes will appear two times, but the earthquakes array will be an object with the
given shake.

# GET
[ ] Test script

+ Response 200 (application/json)

		{
			"events": [
				{ },
				{ }
			],
			"count": 12
		}		


# POST
[ ] Test script

Return the event list with pagination.

+ Request Pagination (application/json)

		{
			"page": 2,
			"limit": 50,
			"orderby": "population.affected|earthquakes.magnitude|donationsvolume|earthquakes.date",
			"sort": "asc|desc"
		}

+ Request Filter by country (application/json)

		{
			"country": "ITA"
		}

+ Request Filter by types (application/json)

		{
			"types": ["flood"]
		}
		
+ Request Only populated events (application/json)

		{
			"populated": true
		}

+ Response 200 (application/json)

		{
			"events": [
				{ },
				{ }
			]
		}


# GET /event/:id
[ ] Test script

Return an event given its id.

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/event_earthquake.json) -->

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/event_wildfire.json) -->

+ Response 404 (application/json)

		{"error": "E2", "message": "resource not found"}




# GET /event/:id/affectedusers
[x] Test script

Return the affected users list for an event.

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/affectedusers.json) -->

