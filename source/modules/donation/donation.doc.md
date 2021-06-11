# Group Donation

Funzionalita' riguardanti le donazioni.

## Donation flow
Il flow di creazione di una donazione e' il seguente:
1. L'utente fa una request a donation/create con le informazioni relative al destinatario.
2. L'utente riceve in risposta un txhex; viene firmato dall'utente e ripassato al server con wallet/send
3. Il server verifica la signature dell'utente, ed aggiunge la propria; la transazione viene poi broadcastata

Il quantitativo inviato da una donazione diventa effettivamente calcolato nelle statistiche Dopo
un totale di conferme.


## Request an invoice [POST /donation/:txid/requestinvoice]
[ ] Test script

Richiede l'invoice per una data donazione.

+ Response 200 (application/json)

		{

		}


## Donation by txid [GET /donation/:txid]
[ ] Test script

Returns detailed informations about a single donation.


+ Response 200 (application/json)

		<!-- include(../docs.shared/body/donation.json) -->

+ Response 200 (application/json)

		{
			"_id": "54035340",
			"txid": "BITCOINTRANSACTION",
			"value": 5.12,
			"from": "username",
			"project": "projectid",
			"fromcountry": "ITA",
			"tocountry": "AFG",
			"tocountries": ["AFG", "IND"],
			"time": "2015-07-13T17:04:09.720Z",
			"status": "broadcasted"
		}


## Donation with gift data [GET /donation/:txid/gift?token=tok]
[ ] Test script

Returns detailed informations about a single donation.


+ Response 200 (application/json)

		<!-- include(../docs.shared/body/donation.json) -->

+ Response 200 (application/json)

		{
			"_id": "54035340",
			"txid": "BITCOINTRANSACTION",
			"value": 5.12,
			"from": "username",
			"project": "projectid",
			"fromcountry": "ITA",
			"tocountry": "AFG",
			"tocountries": ["AFG", "IND"],
			"time": "2015-07-13T17:04:09.720Z",
			"status": "broadcasted",
			"gift": {
				"message": "Ciao",
				"name": "Luca"
			}
		}


## Donation by internal id [GET /donation/i/:id]
[ ] Test script

Get a transaction by its internal id.


## Alt donation by donation internal id [GET /donation/i/:id/alt]
[ ] Test script

Get the altcurrency informations of the transaction by its internal id

+ Response 200 (application/json) 

		{
			"expiry": "12 oct 12",
			"currency": "LTC",
			"amount": 0.12,
			"confirmations": "3/46",
			"status": "WAITING_FOR_DEPOSIT|DEPOSIT_RECEIVED|DEPOSIT_CONFIRMED|EXECUTED|CANCELED|EXPIRED"
		}



## Donation graph [/donations/graph]

### Last data [GET]
[ ] Test script
Return last graph data

+ Response 200 (application/json)

		<!-- include(../docs.shared/body/donation_graph.json) -->

### Filter by date [POST]
[ ] Test script
Return graph data with pagination options

+ Request Filters (application/json)

		{
			"start": "12 april 2015",
			"end": "15 april 2015"
		}
		
+ Response 200 (application/json)

		<!-- include(../docs.shared/body/donation_graph.json) -->
	
## Event donation graph [GET /event/:id/graph]
[ ] Test script

Return graph data for an event, same as /donations/graph

## Project donation graph [GET /project/:id/graph]
[ ] Test script

Return graph data for a project, same as /donations/graph

## User donation graph [GET /user/:id/graph]
[ ] Test script

Return graph data for an user, same as /donations/graph



## Donation list [/donations]

### Last donations [GET]
[ ] Test script
Restituisce una lista delle ultime donations.

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->


### List query [POST]
[ ] Test script

Restituisce una lista delle ultime donations.

+ Request Pagination (application/json)

		{
			"page": 3,
			"limit": 50,
			"sort": "asc|desc",
			"orderby": "time|value|from",
			"page": 1
		}

+ Request Polling (application/json)

		{
			"lastid": 1900342,
			"limit": 50,
		}

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->



## User donation chart [GET /user/:name/donations/chart]
[ ] Test script

Restituisce le donazioni in entrata di un dato utente come dati per un grafico. Di default da il grafico
weekly.

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_chart.json) -->


## Event donation chart [GET /event/:id/donations/chart]
[ ] Test script

Restituisce le donazioni in entrata di un dato evento come dati per un grafico. Di default da il grafico
weekly.

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_chart.json) -->


## Project donation chart [GET /project/:id/donations/chart]
[ ] Test script

Restituisce le donazioni in entrata di un dato progetto come dati per un grafico. Di default da il grafico
weekly.

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_chart.json) -->



## User donations [/user/:name/donations]

Restituisce le donazioni di un dato utente dato il suo username.

### All [GET]
[ ] Test script

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->


### Paginate and filter by flow [POST]
[ ] Test script

+ Request Donations (application/json)

		{
			"flow": "in|out|both"
		}

+ Request Pagination (application/json)

		{
			"page": 3,
			"limit": 50,
			"sort": "asc|desc",
			"orderby": "time|value|from",
			"page": 1
		}

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->




## Campaign donations [/campaign/:id/donations]

Returns the incoming donations to a campaign.

### Last [GET]
[ ] Test script

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->



### Paginate [POST]
[ ] Test script

+ Request Pagination (application/json)

		{
			"page": 3,
			"limit": 50,
			"sort": "asc|desc",
			"orderby": "time|value|from",
			"page": 1
		}

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->



## Project donations [/project/:id/donations]

Returns the incoming donations to a project.

### Last [GET]
[ ] Test script

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->



### Paginate [POST]
[ ] Test script

+ Request Pagination (application/json)

		{
			"page": 3,
			"limit": 50,
			"sort": "asc|desc",
			"orderby": "time|value|from",
			"page": 1
		}

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->



## Event donations [/event/:id/donations]

Restituisce le donazioni flow-in di un dato evento.

### Last [GET]
[ ] Test script

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->



### Paginate [POST]
[ ] Test script

+ Request Pagination (application/json)

		{
			"page": 3,
			"limit": 50,
			"sort": "asc|desc",
			"orderby": "time|value|from",
			"page": 1
		}

+ Response 200 (application/json)
	+ Body

		<!-- include(../docs.shared/body/donation_list.json) -->




## Create an event donation [POST /donation/event/:eid/create]
[ ] Test script event
[ ] Test script event with conversion

Crea una donazione verso un gruppo di utenti afflitti da un evento; la request Donate restituisce una o piu' transazioni 
firmate con la chiave privata dal server. La transazione verra' quindi firmata dal client, e pubblicata tramite POST a /wallet/send. Value e' la somma dell'amount piu' la fee.


+ Request (application/json)

		{
			"address": "mpSupt9iCTkNxBjqx1CmFLYEPbj8prvDUf",
			"value": 10.33,
			"users": { "dakk": 0.033, "gianni": 0.12, "helperbit": 0.12 },
			"fee": 0.33
		}


+ Response 200 (application/json)

		{
			"fee": 0.01,
			"value": 0.2,
			"txhex": "01000000015aece077afdc68bcb031ab33c89543010efd24373dd92a081d0bf5bdb94af86000000000fdfd0000483045022100802056ac2372fbb4eea7273836682b7524bddfd50a0db6569a9fd5efc7f17d42022033ba2e6207aca9647ae8f715097607af1b67f5df1f7060acc9f54d52c44aaa43014730440220298f7dc8ab59fa915415b0cdd2988f999308370b70268224a39f37c23f3737730220093d27e3e922316c2b2e679a203b9e4afc610752202a00a3a623fe867812bd0f014c695221021bf6d3a8f8f59c3d773082c0ca4bf432e26f460d82e8e4a195d0d147e2cb641e2102deeba31db99eea0151bd6681e61a356744329c3ced78e4016672f4afca5538722102a071b8829967e4da29f77659e53e722c99ae04a56788bba60a538a47ac530e2053aeffffffff0840420f000000000017a91496bee9d091f3d2f9040250e5904d6de80ce8f52b8740420f000000000017a914c3a75be399969766d4dbe36b00e25785c56625ef8740420f000000000017a914eae4760700fecd05454fe3c738e3964c58b1b4ee8740420f000000000017a914e3297070d2140873d000849a41abc2e4450ece2c8740420f000000000017a9147692a9abb5d0d1a53801eaf1525c1751b7211c6a8740420f000000000017a914b0389000b63b304e90f0b76c5d69d1303406f9448740420f000000000017a9143cef004107b7ebd03bc27260e6c6547cd65eb52487972f3c000000000017a914a6643b2f777aa5abf647ad9b2e1c5777c774ee988700000000",
			"donation": "56bca14fedc296600d04a46a"
		}

+ Response 500 (application/json)

		{"error": "EW1", "message": "not enough funds"}


+ Response 500 (application/json)

		{"error": "EW4", "message": "no users selected"}






## Donate to project [GET /project/:id/donate?{amount}&{extend}&{altcurrency}&{username}&{campaign}&{giftemail}&{giftmessage}&{giftname}]
[x] Test script

Request the address for donations of a given project.

Crea un documento Donation dove expiry e' diverso da null e status!broadcasted.
Tale documento viene controllato periodicamente se expiry e' diverso da null.

L'amount restituito potrebbe essere differente da quello inserito dall'utente 
(in termini di qualche satoshi), per poter distinguere le donazioni dai diversi
utenti.

Se altcurrency e' diverso da BTC, allora la donazione e' una donazione tramite alt, viene restituito
l'altaddress e l'altamount. In caso di donazione alt, il parametro username opzionale permette
di registrare il from.

+ Parameters

    + amount (number) - The amount you want to donate
    + extend (boolean, optional) - Extend the donation time (only BTC donations)
    + altcurrency (string, optional) - Altcurrency you want to use for donation
	+ username (string, optional) - Associate the donation to a given user
	+ campaign (string, optional) - Associate the donation to a given user fundrasing campaign
	+ giftemail (string, optional) - Email to send to the gift email
	+ giftmessage (string, optional) - A comment for the gift
	+ giftname (string, optional) - Name of the donor


+ Response 200 (application/json)

		{ 
			"address": "1X123343234", 
			"amount": 1.0,
			"expiry": "12 Maggio 2015",
			"donation": "tempiddonation"
		}

+ Response 200 (application/json)

		{
			"altaddress": "",
			"altamount": "", 
			"altcurrency": "LTC",
			
			"address": "1X123343234", 
			"amount": 1.0,
			"expiry": "12 Maggio 2015",
			"donation": "tempiddonation"
		}


## Donate to user [GET /user/:id/donate?{amount}&{extend}&{altcurrency}&{username}&{campaign}&{giftemail}&{giftmessage}&{giftname}]
[ ] Test script

Request the address for donations of a given user.

Crea un documento Donation dove expiry e' diverso da null e status!broadcasted.
Tale documento viene controllato periodicamente se expiry e' diverso da null.

L'amount restituito potrebbe essere differente da quello inserito dall'utente 
(in termini di qualche satoshi), per poter distinguere le donazioni dai diversi
utenti.

Se altcurrency e' diverso da BTC, allora la donazione e' una donazione tramite alt, viene restituito
l'altaddress e l'altamount. In caso di donazione alt, il parametro username opzionale permette
di registrare il from.

+ Parameters

    + amount (number) - The amount you want to donate
    + extend (boolean, optional) - Extend the donation time (only BTC donations)
    + altcurrency (string, optional) - Altcurrency you want to use for donation
	+ username (string, optional) - Associate the donation to a given user
	+ campaign (string, optional) - Associate the donation to a given user fundrasing campaign
	+ giftemail (string, optional) - Email to send to the gift email
	+ giftmessage (string, optional) - A comment for the gift
	+ giftname (string, optional) - Name of the donor

+ Response 200 (application/json)

		{ 
			"address": "1X123343234", 
			"amount": 1.0,
			"expiry": "12 Maggio 2015",
			"donation": "tempiddonation"
		}

+ Response 200 (application/json)

		{
			"altaddress": "",
			"altamount": "", 
			"altcurrency": "LTC",

			"address": "1X123343234", 
			"amount": 1.0,
			"expiry": "12 Maggio 2015",
			"donation": "tempiddonation"
		}