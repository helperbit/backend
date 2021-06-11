# GET /wallet/verify/list
[x] Test script

Returns the list of wallets with the last verification date.

A transaction is history can have one of the following state:
- signed: concluded state
- signing: a transaction wich needs to be signed; for single user is signable by the user, for multisig
	is signable by the admins
- creation: a transaction need to be created; the owner of the address (ie the npo) need to proceed to the creation


+ Response No profit (application/json)

        {
            "verifications": [
				{
					"address": "3X4hb353242423423124",
					"label": "Principale",
					"ismultisig": true,
                    "lastverify": "12/12/12",
					"scripttype": "p2wsh", 
					"hardware": "none",
					"history": [
						{
							"status": "signing",
							"time": "12 may 29",
							"value": 3244,
							"locktime": 43543,
							"signers": 2,
							"admins": 4
						},
						{
							"status": "signed",
							"time": "12 may 29",
							"value": 3244,
							"locktime": 43543,
							"signers": 2,
							"admins": 4
						}
					]
				}
			]
		}

+ Response Single user (application/json)

        {
            "verifications": [
				{
					"address": "3X4hb353242423423124",
					"label": "Principale",
					"ismultisig": false,
                    "lastverify": "12/12/12",
					"scripttype": "p2wsh", 
					"hardware": "none",
					"history": [
						{
							"status": "signing",
							"time": "12 may 29",
							"value": 3244,
							"locktime": 43543
						},
						{
							"status": "signed",
							"time": "12 may 29",
							"value": 3244,
							"locktime": 43543
						}
					]
				}
			]
		}



# GET /wallet/verify/pending
[ ] Test script

Returns the list of pending signing verifications. For single users, it also returns pending transactions
from multisig address where they are admins.


+ Response (application/json)

		{
			"pending": [
				{
					"_id": "45435435",
					"status": "signing",
					"time": "12 may 29",
					"value": 3244,
					"locktime": 43543,
					"wallet": {
						"id": "324324",
						"label": "Ciao",
						"address": "3M345234243",
						"ismultisig": false
					}
				},
			]
		}


# POST /wallet/:address/verify/sign
[ ] Test script

Submit the signed single-sign transaction for a transaction in a "signing" status.

+ Request Submit signature (application/json)

		{
			"txhex": "3424235423",
			"recoveryhex": "45345345"
		}

+ Response 200 (application/json)

		{}


# POST /wallet/:adderss/verify/feed
[ ] Test script

Submit a signature for a multisig wallet with a transaction in "signing" status.

+ Request Submit signature (application/json)

		{
			"txhex": "3424235423",
			"recoveryhex": "45345345"
		}

+ Response 200 (application/json)

		{}


# GET /wallet/verify/:id
[x] Test script 

Returns a given tltx

+ Response  200 (application/json)

		{
			"wallet": {
				"id": "5daf0dc9d1614d828ad47772",
				"address": "2Mxes4rF73fmGDowjYVv5d2yn3gSP6A4uQQ",
				"ismultisig": false,
				"label": "Default-3",
				"hardware": "none"
			},
			"txid": "5daf0dcad1614d828ad47773",
			"status": "signing",
			"scripttype": "p2sh-p2wsh",
			"onlycheck": true,
			"pubkeys": [
				"03c411cf39aca4395c81c35921dc832a0d1585d652ab1b52ccc619ff9fbbc57877", "020636d944458a4663b75a912c37dc1cd59b11f9a00106783a65ba230d929b96b0", "02f3faf53bf20a3a9110c808a32f7b3218bd69ddf5810bcd9c3ce298c26f132c9a"
			],
			"hardwareadmins": [],
			"hardwaretypes": [],
			"signers": [],
			"admins": [],
			"_id": "5daf0dcad1614d828ad47773",
			"utxos": [],
			"time": "2019-10-22T14:10:18.026Z",
			"from": "testwalletverify_single1",
			"to": "n1fjSoaiUuVFmCmePiFCBGpbrgiT8t9vGJ",
			"toalternative": "n1fjSoaiUuVFmCmePiFCBGpbrgiT8t9vGJ",
			"n": null,
			"locktime":1603376624,
			"hex": "70736274ff01002c02000000000100000000000000001976a914dd0b888d9462c1f7253b3583a503f1ee81d48ede88acca92915f000000",
			"recoveryhex": "70736274ff01002c02000000000100000000000000001976a914dd0b888d9462c1f7253b3583a503f1ee81d48ede88ac4ac67261000000"
		}



# POST /wallet/:address/verify/remove
[ ] Test script

Delete a verification in signing status

+ Request Start (application/json)

		{
		}


# POST /wallet/:address/verify/start
[ ] Test script

Start a verification process, returns the full created tltx (same as GET /wallet/verify/:id)

+ Request Start (application/json)

		{
		}

+ Response 200 (application/json)

		{
			"wallet": {
				"id": "5daf0dc9d1614d828ad47772",
				"address": "2Mxes4rF73fmGDowjYVv5d2yn3gSP6A4uQQ",
				"ismultisig": false,
				"label": "Default-3",
				"hardware": "none"
			},
			"txid": "5daf0dcad1614d828ad47773",
			"status": "signing",
			"scripttype": "p2sh-p2wsh",
			"onlycheck": true,
			"pubkeys": [
				"03c411cf39aca4395c81c35921dc832a0d1585d652ab1b52ccc619ff9fbbc57877", "020636d944458a4663b75a912c37dc1cd59b11f9a00106783a65ba230d929b96b0", "02f3faf53bf20a3a9110c808a32f7b3218bd69ddf5810bcd9c3ce298c26f132c9a"
			],
			"hardwareadmins": [],
			"hardwaretypes": [],
			"signers": [],
			"admins": [],
			"_id": "5daf0dcad1614d828ad47773",
			"utxos": [],
			"time": "2019-10-22T14:10:18.026Z",
			"from": "testwalletverify_single1",
			"to": "n1fjSoaiUuVFmCmePiFCBGpbrgiT8t9vGJ",
			"toalternative": "n1fjSoaiUuVFmCmePiFCBGpbrgiT8t9vGJ",
			"n": null,
			"locktime":1603376624,
			"hex": "70736274ff01002c02000000000100000000000000001976a914dd0b888d9462c1f7253b3583a503f1ee81d48ede88acca92915f000000",
			"recoveryhex": "70736274ff01002c02000000000100000000000000001976a914dd0b888d9462c1f7253b3583a503f1ee81d48ede88ac4ac67261000000"
		}

+ Response 500 (application/json)

		{
			"error": "EWV1",
			"message": "already a verification in creation or signing"
		}