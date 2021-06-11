Helperbit utilizza wallet multisig 2of3 dove le chiavi sono cosi' distribuite:
- Chiave utente
- Chiave utente di backup
- Chiave server

In questo modo, se helperbit dovesse perdere la chiave del server, un utente puo' comunque sbloccare i fondi utilizzando
la sua chiave e quella di backup. Una transazione, per avvenire, deve essere firmata da almeno due di queste chiavi.
Oppure se l'utente dimentica il mnemonico della sua chiave, puo' usare il file di backup per sbloccare i fondi.

Il flow di creazione account e' il seguente:
1. L'utente genera due priv key, una randomizzata che viene criptata tramite un PIN (e successivamente salvata nel pc dell'utente),
ed una generata da un mnemonic (una password).
2. L'utente invia le chiavi pubbliche al server con POST /create, il server genera la sua priv key e la memorizza criptata nel db, genera
l'address 2of3, salva una row wallet nel db, restituisce al client l'address del nuovo indirizzo.

Il flow per una donazione /donate e /withdraw invece, prevede che:
1. Il server crea la transazione con gli output, la firma con la sua chiave privata e la restituisce all'utente.
2. L'utente firma la transazione con una delle sue chiavi e la invia nuovamente al server con /wallet/send
3. Il server fa il broadcast nella rete bitcoin.


# POST /wallet/create
[x] Test script

+ Request Generate (application/json)

		{
			"pubkeys": ["pubkey1", "pubkey2"],
			"scripttype": "p2sh-p2wsh"
		}

+ Request Generate with hardware wallet (application/json)

		{
			"pubkeys": ["pubkey1", "pubkey2"],
			"hardware": true,
			"hardwaretype": "ledgernanos",
			"scripttype": "p2sh-p2wsh"
		}

+ Response 401 (application/json)

		{"error": "E1", "message": "you're not authenticated"}

+ Response 500 (application/json)

		{"error": "EW6", "message": "max 10 addresses allowed"}

+ Response 500 (application/json)

		{"error": "E", "message": "generic error"}

+ Response 200 (application/json)

		{
			"pubkeysrv": "serverpubkey",
			"address": "3NEWBTCADDRESS"
		}




# GET /wallet
[x] Test script (Normal)
[x] Test script (Multisig)

Restituisce le informazioni riguardanti i wallet dell'utente loggato. Adminof contiene i wallet dei quali
si e' admin.

+ Response 200 (application/json)

		{
			"wallets": [
				{
					"address": "3X4hb353242423423124",
					"label": "Principale",
					"owner": "dakk",
					"creationdate": "12/12/12",
					"pubkeys": ["pub1", "pub2", "pub3"],
					"ismultisig": false,
					"scripttype": "p2sh-p2wsh"
					"hardware": true,
					"hardwaretype": "ledgernanos",
					"lasttimelocktransaction": null
				},
				{
					"address": "3X4hb353242423423124",
					"label": "Principale",
					"owner": "dakk",
					"creationdate": "12/12/12",
					"pubkeys": ["pub1", "pub2", "pub3"],
					"ismultisig": true,
					"multisig": { 
						"n": 2, 
						"admins": ["dak.linux@gmail.com"], 
						"hardwareadmins": ["dak.linux@gmail.com"], 
						"hardwaretypes": ["ledgernanos"],
						"active": true 
					},
					"scripttype": "p2sh-p2wsh",
					"lasttimelocktransaction": null
				}
			],
			"adminof": [
				{
					"address": "3X4hb353242423423124",
					"label": "Principale",
					"owner": "dakk",
					"creationdate": "12/12/12",
					"pubkeys": ["pub1", "pub2", "pub3"],
					"ismultisig": true,
					"multisig": { 
						"n": 2, 
						"admins": ["dak.linux@gmail.com"], 
						"hardwareadmins": [],
						"hardwaretypes": [],
						"active": true 
					},
					"scripttype": "p2sh-p2wsh",
					"lasttimelocktransaction": null
				}
			]

			"receiveaddress": "3X4hb353242423423124"
		}
		


# GET /wallet/:address
[x] Test script

Return information about a single user wallet.

+ Response 200 (application/json)

		{
			"address": "3X4hb353242423423124",
			"label": "Principale",
			"owner": "dakk",
			"creationdate": "12/12/12",
			"pubkeys": ["pub1", "pub2", "pub3"],
			"ismultisig": true,
			"multisig": { "n": 2, "admins": ["dak.linux@gmail.com"], "active": true },
			"scripttype": "p2sh-p2wsh",
			"lasttimelocktransaction": null
		}

# DELETE /wallet/:address

+ Response 500 (application/json)

		{ "error": "EF2", "message": "wallet not empty" }

+ Response 500 (application/json)

		{ "error": "EW12", "message": "completed multisig wallets cannot be deleted" }


# POST /wallet/:address/update
[x] Test script

Aggiorna un wallet

+ Request Update label (application/json)

		{ "label": "Nuova label" }

+ Request Update receive address (application/json)

		{ "receive": true }


+ Response 200 (application/json)

		{}


# GET /wallet/:address/faucet
[x] Test script

Invia monete all'indirizzo indicato; funzionalita' di debug per la pre-alpha in testnet.

+ Response 200 (application/json)

		{ "txid": "3543632fruht42r32t3g42f" }


+ Response 500 (application/json)

		{ "error": "EF1", "message": "no faucet funds" }

+ Response 500 (application/json)

		{ "error": "EF2", "message": "wallet not empty" }


+ Response 500 (application/json)

		{ "error": "EW5", "message": "transaction not sent" }


# GET /user/:name/addresses
[x] Test script

Restituisce gli indirizzi di un utente

+ Response 200 (application/json)

		{
			"addresses": ["32543tgh3ui34234"]
		}



# POST /wallet/:address/withdraw/fees
[x] Test script
[x] Test script multisig
[x] Test script segwit
[x] Test script segwit multisig
[x] Test multi destinations

Return the fee calculated for a withdraw. The amount returned is in satoshi.

+ Request (application/json)

		{
			"value": 10.33,
			"destination": "1Addrdestinazione",
		}

+ Request Multiple destinations (application/json)

		{
			"value": 10.33,
			"distribution": {
				"username1": 1.0,
				"username2": 1.0,
				"username3": 1.0
			}
		}

+ Response 200 (application/json)

		{ 
			"fees": 432123324,
			"fastest": 432123324,
			"slowest": 432123324,
			"hour": 432123324,
			"halfhour": 432123324
		}

+ Response 500 (application/json)

		{ "error": "EW2", "message": "bad address" }


+ Response 500 (application/json)

		{ "error": "EW1", "message": "not enough funds" }




# POST /wallet/:address/withdraw
[x] Test script
[x] Test script multisig
[x] Test script segwit
[x] Test script segwit multisig

Create a transaction for sending value-fee to destination. 
Value is the amount without the fee.

+ Request Multisig (application/json)

		{
			"value": 10.33,
			"destination": "1Addrdestinazione",
			"fee": 0.00038,
			"description": "Invio denaro al nostro strozzino"
		}


+ Request Pay ROR Multisig (application/json)

		{
			"value": 10.33,
			"destination": "1Addrdestinazione",
			"fee": 0.00038,
			"description": "Invio denaro al nostro strozzino",
			"ror": "id"
		}


+ Request Normal (application/json)

		{
			"value": 10.33,
			"destination": "1Addrdestinazione",
			"fee": 0.00038
		}

+ Response 200 (application/json)

		{ 
			"txhex": "235436378471574y1671354793467314689314753467384",
			"utxos": [
				{ "tx": "txhash", "n": 2, "value": 234 }
			] 
		}

+ Response 500 (application/json)

		{ "error": "EW2", "message": "bad address" }


+ Response 500 (application/json)

		{ "error": "EW1", "message": "not enough funds" }



# POST /wallet/:address/send
[x] Test script
[x] Test script donation

Invia una transazione firmata dall'utente e dal server.

+ Request Send a donation (application/json)

		{
			"txhex": "SIGNED_TRANSACTION_DATA",
			"donation": "1354543"
		}

+ Request Send funds (application/json)

		{
			"txhex": "SIGNED_TRANSACTION_DATA"
		}



+ Response 200 (application/json)

		{
			"txid": "transaction_ID"
		}


+ Response 200 (application/json)

		{
			"txid": "transaction_ID",
			"donation": "45435312423"
		}
		





# GET /wallet/:address/txs
[x] Test script

Restituisce le ultime transazioni (confermate e non)

+ Response 200 (application/json)

		{
			"txs": [
				{ "txid": "", "value": 4.3, "time": "14324342", "confirmations": 2, "in": false }
			]
		}





# GET /wallet/:address/balance
[x] Test script

Restituisce il bilancio di un wallet, ed il totale ricevuto.

+ Response 200 (application/json)

		{ "balance": 12.0, "unconfirmed": 4.2, "received": 12.0 }
	
	
