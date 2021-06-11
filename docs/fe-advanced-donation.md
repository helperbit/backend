

Problemi
--------

1. Se l'utente A viene selezionato, ma poi si abbassa il trustlevel, deve essere nascosto?
	Possiamo usare i filtri solo come abilitatori.
	



Possibile reimplementazione
---------------------------

Il modulo di donazione avanzata permette diversi tipi di interazione:

1. Filtro per area della shakemap
2. Filtro per selezione manuale della tipologia
3. Filtro per selezione manuale singolo utente
4. Filtro per trustlevel
5. Filtro per amount e distribuzione
6. Filtro per sorting dei single users

I primi 4 filtri determinano le condizioni di selezione stringente definite dall'utente. 
Il filtro 5 e 6 invece, dev'essere applicato dopo i filtri precedenti.



Possiamo ristrutturare la logica in questo modo:
1. I selezionatori manuali da 1 a 4 vanno a modificare un oggetto of di filtering:
	
		{
			"shakemap": 1,
			"typesenabled": ['singleuser', 'npo'],
			"userenabled": ['gianni'],
			"mintrust": 44
		}
		
2. of viene applicato ad una funzione di filtro: Users_f contiene gli utenti disponibili dopo l'applicazione del filtro.

		f -> of.t -> users -> users_f
	
3. user_f viene poi passato ad una funzione che ordina i single user
4. gli utenti restanti vengono passati ad una funzione che riceve amount e distribuzione, e restituisce
	solo gli utenti candiati a comparire nella mappa
5. gli utenti candidati vengono abilitati e visualizzati





