# Group Lightning

## Create an invoice [POST /lightning/invoice/create]
[x] Test script

Crea un invoice per un pagament lightning; il valore dell'invoice e' specificato in msat, ovvero la 
millesima parte di 1 satoshi, ovvero 0.00000001 BTC. Insieme al valore, viene anche passato un
oggetto metadata, il quale contiene al suo interno il campo "type" (sempre presente) che consente
al backend di assegnare il pagamento ad una specifica applicazione lightning, ed ulteriori campi ad 
uso interno. Una volta creata l'invoice, il campo payreq e' il codice che permette di fare il 
pagamento (quindi da mostrare nel qrcode).

+ Request Invoice creation 

        {
            "msat": 5000,
            "metadata": {
            	"type": "charitypot",
                "other": 123
        	} 
        }

+ Response 200 (application/json)

		{ 
			"status": "unpaid",
			"_id": "5ca4b2251b083b6718989409",
			"metadata": { "type": "testlightning", "vote": "pino" },
			"expires_at": "2019-04-03T14:17:50.000Z",
			"created_at": "2019-04-03T13:17:50.000Z",
			"msatoshi": 1000,
			"invoiceid": "PDxIkt9La2h1iG~VTIEcz",
			"rhash": "0d1602c2f225f0d8248bd85f8501b90cfa5e5fa277fc1c704c2aa98897dc1a9c",
			"payreq": "lnbc10n1pw2fvn7pp5p5tq9shjyhcdsfytmp0c2qdepna9uhazwl7pcuzv925c397ur2wqdp8f35kw6r5de5kueeqgd5xzun8v5syjmnkda5kxegcqp2xhc802sntauav6zsxg529xt3rdpyzmedccp706fkrah0h5rnu0kqqcnsux9xhyshtgxrkrl76l9024mq8cdeuqu8swtk6m0yycq9n3cp4yqh4f",
			"username": "dakk"
		}



## Get an invoice [GET /lightning/invoice/{invoiceid}]
[x] Test script

Get an invoice given its invoiceid.

+ Parameters
	+ invoiceid ... Invoice ID


+ Response 200 (application/json)

		{ 
			"status": "unpaid",
			"_id": "5ca4b2251b083b6718989409",
			"metadata": { "type": "testlightning", "vote": "pino" },
			"expires_at": "2019-04-03T14:17:50.000Z",
			"created_at": "2019-04-03T13:17:50.000Z",
			"msatoshi": 1000,
			"invoiceid": "PDxIkt9La2h1iG~VTIEcz",
			"rhash": "0d1602c2f225f0d8248bd85f8501b90cfa5e5fa277fc1c704c2aa98897dc1a9c",
			"payreq": "lnbc10n1pw2fvn7pp5p5tq9shjyhcdsfytmp0c2qdepna9uhazwl7pcuzv925c397ur2wqdp8f35kw6r5de5kueeqgd5xzun8v5syjmnkda5kxegcqp2xhc802sntauav6zsxg529xt3rdpyzmedccp706fkrah0h5rnu0kqqcnsux9xhyshtgxrkrl76l9024mq8cdeuqu8swtk6m0yycq9n3cp4yqh4f",
			"username": "dakk"
		}

+ Response 404 (application/json)

		{ "error": "E2", "message": "resource not found" }


## Get an invoice by internal id [GET /lightning/invoice/i/{id}]

Get an invoice given its internal id.

+ Parameters
	+ id ... Internal ID of the invoice


## Get lightning node info [GET /lightning/info]

Returns lightning subsystem info. The online field could be false: in that case we cannot 
create new invoices.


+ Response 200 (application/json)

		{
			"invoices": 32,
			"volume": 12143777,
			"node": "021c8c007659d916b86e60d6715d467239bb9b8cecf7b5c3fd9a345935b1f7f0e5",
			"online": true,
			"nodeinfo": {
				"id": "021c8c007659d916b86e60d6715d467239bb9b8cecf7b5c3fd9a345935b1f7f0e5",
				"alias": "Helperbit.com",
				"color": "feb737",
				"num_peers": 6,
				"num_pending_channels": 0,
				"num_active_channels": 6,
				"num_inactive_channels": 0,
				"address": [{
					"type": "ipv4",
					"address": "51.38.165.38",
					"port": 9735
				}],
				"binding": [{
					"type": "ipv4",
					"address": "51.38.165.38",
					"port": 9735
				}],
				"version": "v0.7.0-278-gf82e779",
				"blockheight": 1513823,
				"network": "testnet",
				"msatoshi_fees_collected": 0,
				"fees_collected_msat": "0msat"
			}
		}