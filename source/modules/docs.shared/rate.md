# Group Rate limits

Il ratelimit per le chiamate alle call del backend utilizza l'indirizzo IP
dell'utente come filtro ed attua le seguenti politiche:

- Politica generale: massimo 100 request al minuto
- Login: massimo 20 request ogni 15 minuti; dopo 5 fallimenti rallenta di 1 secondo ogni successiva request
- Signup: massimo 10 request all'ora


In caso di superamento del limite, viene restituito un errore con status code 429.