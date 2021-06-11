Il walleting multisig e' l'unico modo per le organizzazione di ricevere donazioni;
anche i singleuser e company hanno wallet multisig, pero' il signolo utente detiene due chiavi
(mnemonico + backup) mentre il server detiene una terza chiave.

Per le organizzazioni, il server mantiene sempre una terza chiave, ma e' utilizzata
solo per il recupero dei fondi quando la maggior parte degli admin perde l'account.

Il flow di creazione di un multisig delle organizzazioni e' il seguente:
1. L'organizzazione va in /wallet/admin ed aggiunge tramite email degli account signoli
che avranno il titolo di admin della organizzazione.
2. L'organizzazione va in /wallet e avvia la procedura per la creazione di un wallet;
seleziona il numero minimo di signature, e gli admin da abilitare nel wallet e viene
chiamata /wallet/multisig/create. Una volta fatto,
viene inviata una notifica agli admin per inserire la loro chiave.
3. L'utente admin accede al suo account ed al link della notifica (tramite mail o tramite notifica)
4. L'utente vede una finestrella che gli propone un mnemonico della privkey da feedare al wallet;
la pubkey viene inviata al wallet dell'organizzazione con /wallet/multisig/feed
5. Quando l'ultimo admin fa la feed, il wallet viene effettivamente creato, viene calcolato
l'address ed il wallet e' pronto all'uso.


# POST /wallet/multisig/create
[x] Test script

Create a multisig wallet for the organization. N is the number of required signature for
signing a transaction; it should be less than the number of admins, and greater or equal than 2.
The number of admins should be less or equal to 10.

+ Request (application/json)

		{
			"admins": ["gianni@luca.it", "pinuccio@gmail.com", "sempronio@gmail.com"],
			"n": 3,
			"label": "Wallet donazioni Africa",
			"scripttype": "p2sh-p2wsh"
		}

+ Response 500 (application/json)

		{ "error": "E", "message": "generic error" }
		
+ Response 401 (application/json)

		{ "error": "E6", "message": "not authorized" }

+ Response 500 (application/json)

		{ "error": "EW10", "message" "multisig wallets need at least n admin users" }

+ Response 500 (application/json)

		{ "error": "EW11", "message": "multisig wallets need at least 3 signatures" }

+ Response 500 (application/json)

		{ "error": "EW14", "message": "multisig wallets can have maximum 10 admins" }


+ Response 200 (application/json)

		{ "id": "3543632fruht42r32t3g42f" }



# POST /wallet/multisig/feed
[x] Test script

Insert a key to a multisig wallet.
Only an admin of the organization who created the wallet can feed a pubkey.

+ Request Feed the key (application/json)

		{
			"pubkey": "145253243r23",
			"wallet": "534tgjfd"
		}

+ Request Feed the key generated using hw wallet (application/json)

		{
			"pubkey": "145253243r23",
			"wallet": "534tgjfd",
			"hardware": true,
			"hardwaretype": "ledgernanos"
		}

+ Response 200 (application/json)

		{ "pubkeysrv": "serverpubkey" }

+ Response 500 (application/json)
	
		{ "error": "E", "message": "generic error" }

+ Response 401 (application/json)
	
		{ "error": "E6", "message": "not authorized" }

+ Response 500 (application/json)

		{ "error": "EW15", "message": "duplicate public key" }


# DELETE /wallet/multisig/:id
[ ] Test script

The owner of the transaction can delete a transaction, if admins did not signed
it yet.

+ Response 200 (application/json)

		{ }

# POST /wallet/multisig/:id/refuse
[x] Test script

Refuse to sign a transaction from an organization. If the majorithy of admins refuse to
sign, the transaction is deleted.

+ Response 200 (application/json)
		
		{ }


# POST /wallet/multisig/:id/sign
[x] Test script

Sign a transaction where the user is one of the admin of the organization which
generate it.

If the user sign the transaction after the broadcast, it receive the broadcast true
with the txid.


+ Request Sign (application/json)

		{
			"txhex": "signedtxhex"
		}

+ Response 200 (application/json)

		{
			"broadcast": false,
			"remaining": 1
		}

+ Response 200 (application/json)

		{
			"broadcast": true,
			"txid": "32382f23fh329f8hu32"
		}

+ Response 500 (application/json)

		{ "error": "E", "message": "generic error" }



# GET /wallet/multisig/txs
[x] Test script

Return multisig transactions that belong to the user as organization or as
admin of an organization.

+ Response 200 (application/json)

		{
			"txs": [
				{
					"hex": "3528hu928374988423890751085230975",
					"to": "1N43422349032",
					"value": 0.12,
					"fee": 0.001,
					"from": "crocerossa",
					"wallet": {
						"id": "143243",
						"label": "ciao",
						"address": "1hebrh4rh4"
					},
					"n": "3",
					"admins": [ "dak.linux@gmail.com", "test@gmail.com" ],
					"signers": [ "test@gmail.com" ],
					"txid": "txid",
					"description": "Invio soldi alla mafia",
					"_id": "12h32324",
					"hardwareadmins":["dak.linux@gmail.com"],
					"hardwaretypes":["ledgernanos"],
					"pubkeys: [ "343241", "324123123", "353453" ],
					"utxos": [
						{ "tx": "txhash", "n": 2, "value": 234 }
					]
				}
			]
		}


# GET /user/:name/txs
[ ] Test script

Return outgoing multisig transactions of an organization.

+ Response 200 (application/json)

		{
			"txs": [
				{
					"to": "1N43422349032",
					"value": 0.12,
					"fee": 0.001,
					"txid": "txid",
					"description": "Invio soldi alla mafia",
					"time": "12 Maggio 2015"
				}
			]
		}


# GET /transaction/:txid
[x] Test script

Return a multisig transaction. If this call is performed by the organization
or by one of the admins, then we return more data like we see in the second response.

The status could be:
- waiting
- signing
- signed
- broadcasted : sent to the network
- confirmed

+ Response 200 (application/json)

		{
			"status": "confirmed",
			"from": "gianni",
			"to": "1N43422349032",
			"value": 0.12,
			"fee": 0.001,
			"txid": "txid",
			"description": "Invio soldi alla mafia",
			"time": "12 Maggio 2015"
		}


+ Response 200 (application/json)

		{
			"admins": ["gianni@gmail.com"],
			"refused": [],
			"signers": ["gianni@gmail.com"],
			
			"status": "confirmed",
			"from": "gianni",
			"to": "1N43422349032",
			"value": 0.12,
			"fee": 0.001,
			"txid": "txid",
			"description": "Invio soldi alla mafia",
			"time": "12 Maggio 2015"
		}
