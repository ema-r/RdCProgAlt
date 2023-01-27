## PlaylistScrubber

## Architettura

![alt text](https://github.com/ema-r/RdCProgAlt/blob/main/architettura.jpg)

## Caratteristiche del progetto
Effettuando l'accesso con il proprio profilo Google o Spotify tramite OAUTH, e' possibile, inserendo il link di una playlist eliminare da quella stessa playlist tutti i video o le canzoni non disponibili.

Le API rese disponibili da questo progetto sono documentate [qui](// inserisci file in questo percorso /server/public/docs/index.html).

## Requisiti
- [docker](https://www.docker.com/) 
    Containerizzazione del progetto
- [node.js](https://nodejs.org)
    Sviluppo logica back-end e front-end
- [npm](https://www.npmjs.com/)
    Gestore di pacchetti
- [nginx](https://www.nginx.com/)
    Ruolo di Web Server. Agisce da reverse proxy per i node di "facciata"
- [RabbitMQ](https://www.rabbitmq.com/)
    Protocollo asincrono, utilizzato per gestire chiamate API con notevole costo computazionale. Richieste sono passate a rabbit da nodi 'frontfacing' e poi smistate a nodi addetti solamente a queste chiamate.

## Caratteristiche Aggiuntive Richieste dalle Specifiche
- Accesso a due servizi REST di terzi parti: Google e Spotify
- Accesso al servizio REST di Google e Spotify tramite utilizzo di OAUTH2.0
- Automazione del processo di test: Mocha e Chai
- Implementazione di CI/CD: github actions

## Configurazione
È necessario recuperare i valori GOOGLE_CLIENT_ID e di GOOGLE_CLIENT_SECRET, recuperati al [Google Cloud Console](https://console.cloud.google.com/apis/) e nella sezione credenziali bisogna crearne di nuove per l'OAUTH con Google, cliccando su "ID Client OAuth". 
Occore scegliere "Applicazione Web" come tipo di applicazione e aggiungere come redirect URI "https://localhost:8443/oauth/google/login".
È, inoltre, necessario recuperare i valori SPOTIFY_CLIENT_ID, Spotify API
SPOTIFY_CLIENT_SECRET e SPOTIFY_USER dalla propria Spotify API.
Ottenute le credenziali da Google e da SPotify, è necessario aggiornare il file .env nella cartella server, nel seguente modo:


```
GOOGLE_CLIENT_ID= il tuo client ID
GOOGLE_CLIENT_SECRET= il tuo client Secret
GOOGLE_REDIRECT_URI=https://localhost:8443/oauth/google/login

SECRET=secret_token

MONGO_URI=mongodb://mongo:27017/
PORT=3000

SPOTIFY_CLIENT_ID= i tuoi dati api Spotify API
SPOTIFY_CLIENT_SECRET= i tuoi dati api Spotify API

```
Sono richiesti anche dei certificati SSL self signed validi, posti nella cartelle ./nginx/cert, cosi da poter utilizzare https.
SECRET e' utilizzato come secret key per varie funzioni di hashing.

## Installazione

- Clonare la repository con:
```
git clone https://github.com/ema-r/RdCProgAlt.git
```

- Spostarsi nella directory "server" ed installare i moduli di node con:

```
cd RdCPRogAlt/server
npm install
```
Questo installa LOCALMENTE, sulla propria macchina unix i moduli npm necessari

- Eseguire il build delle immagini e avviare il compose con:

```
docker compose build
docker compose up
```

- Da Web Browser visitare [https://localhost:8443](https://localhost:8443)

## Test

Per avviare i test automatici occorre spostarsi nella directori "server" e usare il seguente comando:
```
npm test
```
Ambiente di test utilizza account "di servizio" per testare il funzionamento delle funzioni di scrub,
per testare sara' necessario fornire dati di accesso adeguati a quest'ultimo.

## Documentazione Api

[Qui.](https://github.com/ema-r/RdCProgAlt/blob/main/docs.txt)

## Autori

Questo progetto di Reti di Calcolatori è stato sviluppato dagli studenti:
- Andrea Masciarelli
- Emanuele Roncioni
