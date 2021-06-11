# Group Sanity errors

Dove non specificato altrimenti (con errori custom, che presto migreranno a questo nuovo
formato), in una qualsiasi call che prevede lo scambio di dati viene effettuato un
sanity check.

Il check viene fatto per tipo (number, string, object, array, boolean), 
per classi custom (email, username, country), per dimensione del dato
o per valore del dato, e per valore esatto.

Reason puo' assumere i seguenti valori:

- _missing_: valore non presente ma richiesto
- _big_, _small_: valore o lunghezza troppo grande / piccola
- _invalid_: non ha passato la validazione di tipo
- _notmatch_: non coincide col valore richiesto


Se una call restituisce un errore E5 (incomplete social profile) bisogna reindrizzarlo
alla pagina per completare il profilo.

### Small integer

```
{
	"error": "E3",
	"message": "invalid parameters",
	"data": { 
		"name": "fieldname", 
		"reason": 
		"small", 
		"min": 10 
	}
}
```

### Big integer

```
{
	"error": "E3",
	"message": "invalid parameters",
	"data": { 
		"name": "fieldname", 
		"reason": "big", 
		"max": 10 
	}
}
```		

### Not matching value

```
{
	"error": "E3",
	"message": "invalid parameters",
	"data": { 
		"name": "fieldname", 
		"reason": "notmatch", 
		"value": true 
	}
}	
```	
		
### Invalid value

```
{
	"error": "E3",
	"message": "invalid parameters",
	"data": { 
		"name": "fieldname", 
		"reason": "invalid" 
	}
}	
```

### File format not allowed

```
{
	"error": "EM1",
	"message": "invalid format",
	"data": { "supported": ["pdf", "image"] }
}
```


### File above max size

```
{
	"error": "EM2",
	"message": "file is above max size",
	"data": { "value": 20489 }
}
```
		