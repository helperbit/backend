# Group Lightning CharityPot


Durante un periodo di tempo prefissato (chiamiamo round, che ha un inizio, ed una fine), gli utenti possono pagare utilizzando lightning network in una pagina apposita; nel pagamento, oltre a specificare l'importo, danno una preferenza decidendo uno dei progetti attivi. Al termine del round, se non si e' raggiunto un minimo, il round viene esteso, se invece si e' raggiunto un minimo, viene creata (da noi) una donazione verso il progetto che ha ricevuto piu' volume di pagamenti lightning. Una volta terminato il round, se ne crea uno nuovo, con un nuovo termine temporale.

Per fare un pagamento a charitypot, il campo metadata durante la creazione dell'invoice deve contenere:
- round: l'_id del round corrente
- vote: l'_id del progetto votato


## Current round [GET /lightning/charitypot]
[ ] Test script

Ottiene le informazioni del round corrente; results e' ordinato per value, che e' un valore in millisatoshi.

+ Response 200 (application/json)

		{
			"winner": {
				"project": null,
				"donation": null,
				"status": "none"
			},
			"status": "running",
			"value": 0,
			"votes": 0,
			"_id": "5cb87b8d6d882f3c6464d99a",
			"start": "2019-04-18T13:28:45.388Z",
			"results": [
				{
					"votes": 13,
					"value": 10251973,
					"project": "5b51f2035e459846ea03c4ad"
				},
				{
					"votes": 5,
					"value": 25000,
					"project": "5bcc78ddebc526703c0f8d9e"
				},
				{
					"votes": 2,
					"value": 2000,
					"project": "5bc89e9debc526703c0f8d53"
				}
			],
			"expiration": "2019-04-25T13:28:45.388Z",
			"__v": 0
		}


## Round list [GET /lightning/charitypot/rounds]
[ ] Test script

Ottiene le informazioni dei round passati; l'oggetto "winner" contiene l'id del progetto vincitore,
il txid della donazione relativa e status, che puo' essere "none" in caso di round non concluso,
"pending" in caso di round concluso ma donazione da inviare (e quindi donation e' null) e "done"
in caso di progetto concluso e donazione mandata.


+ Response 200 (application/json)

		{
			"rounds": [
				{
					"winner": {
						"project": null,
						"donation": null,
						"status": "none"
					},
					"status": "running",
					"value": 0,
					"votes": 0,
					"_id": "5cb87b8d6d882f3c6464d99a",
					"start": "2019-04-18T13:28:45.388Z",
					"results": [],
					"expiration": "2019-04-25T13:28:45.388Z",
					"__v": 0
				},
				{
					"winner": {
						"project": "5b51f2035e459846ea03c4ad",
						"donation": "24a0466dae42fb0c4173bf0b6810a9bcf304b602d1ab7278619b17181c256785",
						"status": "done"
					},
					"status": "concluded",
					"value": 10278973,
					"votes": 20,
					"_id": "5cb743f7f857d57d2fbdb8ce",
					"start": "2019-04-17T15:19:19.378Z",
					"results": [
						{
							"votes": 13,
							"value": 10251973,
							"_id": "5cb87b8d6d882f3c6464d998",
							"project": "5b51f2035e459846ea03c4ad"
						},
						{
							"votes": 5,
							"value": 25000,
							"_id": "5cb87b8d6d882f3c6464d997",
							"project": "5bcc78ddebc526703c0f8d9e"
						},
						{
							"votes": 2,
							"value": 2000,
							"_id": "5cb87b8d6d882f3c6464d996",
							"project": "5bc89e9debc526703c0f8d53"
						}
					],
					"expiration": "2019-04-18T12:19:20.378Z",
					"__v": 671
				}
			]
		}
		

## Stats [GET /lightning/charitypot/stats]
[ ] Test script

Restituisce alcune statistiche del sistema, numero totale di round conclusi, valore in msat accumulato,
numero di voti ricevuti e target minimo per la conclusione di un round.

+ Response 200 (application/json)

		{
			"votes": 20,
			"value": 10278973,
			"rounds": 2,
			"target": 0.0001
		}
				