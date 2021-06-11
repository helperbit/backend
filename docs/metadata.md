Transactions metatadata
=======================

Le operazioni relative a passaggi di denaro all’interno di helperbit, prevedono l’inserimento di un blocco di metadati il quale specifica informazioni aggiuntive relative al tipo di transazione. Questi metadati permetteranno a parser esterni, di ricostruire il grafo del follow the money a partire dalla sola blockchain. 


Storage
-------

Le possibilita’ per l’integrazione di questi metadati sono varie: 

Il metodo piu’ easy prevede l’integrazione dei dati all’interno di un output opreturn. Questa tecnica e’ malvista dai bitcoiners in quanto saturano la blockchain anche se in questo caso, il servizio offerto e’ di utilita’ comune. Il limite di tale tecnica e’ di 80B. Inoltre l’utilizzo delle OPReturn dovrebbe marcare la transazione teoricamente come non-standard.

La seconda possibilita’ e’ integrare i dati come fakesignature come fa counterparty; anche questo puo’ essere malvisto dalla community per gli stessi motivi della opreturn; qui il limite e’ potenzialmente illimitato, ma all’aumentare delle fakesignature aumenta anche la fee necessaria.

La terza tecnica prevederebbe l’utilizzo di una blockchain esterna, per esempio ethereum, utilizzando una dapp per salvare questo tipo di metadati. Una simile implementazione potrebbe piacere alla community e sarebbe comunque piu’ versatile rispetto alle altre soluzioni. Questo tipo di tecnica prevederebbe dei costi aggiuntivi in quanto dobbiamo creare un ulteriore transazione su una chain esterna.

La quarta tecnica, non completamente attuabile allo stato attuale, e’ utilizzare i segregated witness; in questo modo non si satura il blocco coi nostri metadati, ed utilizziamo una tecnica appositamente studiata per integrare dati aggiuntivi senza compromettere la dimensione del blocco. Nel long term e’ sicuramente la tecnica piu’ adatta.



Signature
---------

Un altro fatto da tenere a mente e’ la necessità di fare in modo che persone esterne non possano in alcun modo creare dei metadati che siano indistinguibili dai nostri. Dato che utilizziamo una chiave diversa per ogni wallet, non possiamo utilizzare come meccanismo di signature la pubkey della serverkey dato che cambia per ogni wallet.

Per opreturn e fake signature si possono studiare due strade:
Integrare una nuova signature nella opreturn (per esempio una gpg o una dsa); il problema e’ mantenere la dimensione della signature bassa
Inserire un ulteriore input nelle transazioni, firmato da una chiave sempre uguale ed appositamente creata da helperbit per firmare i metadati. Bisogna verificare quale opcode utilizzare e se e’ fattibile.

L’utilizzo di ECSDA per firmare e’ troppo dispendioso, in quanto la signature risultante sono 80B; RSA sarebbe un ottimo compromesso in quanto la signature e’ di soli 2048b -> 32B.



Metadati generici
-----------------

Il messaggio e’ cosi’ strutturato:
dai 2 a 4B il magic flag
tipo di messaggio 1 Byte
E: Evento
D: Donazione
W: Withdraw
R: Request of donation
B: Acquisto
U: Proof of user in area
il resto varia a seconda del tipo di messaggio



Evento
------

Registra un evento appena accaduto, timestampandolo nella blockchain; i dati da integrare sono:
provenienza dati (1B)
alert: generato dagli utenti
usgs: preso da usgs
…: altri provider di dati
tipo di evento (1B)
country (3B ISO)
magnitudine (2B)
epicentro (4B+4B)
eventid

L’id della transazione sarà anche l’ID univoco dell’evento, 32B.



Donazione
------

Registra una donazione; partendo dagli input ed output si sa già chi e’ il mittente e chi e’ il destinatario e l’ammontare; gli ulteriori dati da integrare sono:
tipo di donazione (a evento E o a progetto P)
se la donazione va ad un evento, si inserisce l’id dell’evento (32B)
from country (3B ISO)
to country (3B ISO)


