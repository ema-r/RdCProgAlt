const functions = require('./../functions/jwtfun');
const spotifyController = require('./../controllers/spotifycontr.js')
const userController = require('./../controllers/sessioncontr.js');
const axios = require('axios');
const dotenv = require('dotenv').config('./../.env');
const {URLSearchParams} = require('url');

const rabbitfun = require('./../functions/rabbitfun');

var generateRandomString = function(length) {  //va spostata in functions, per ora e' qui
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
var session
var stateKey = 'KAY'

module.exports = function(app) {
	app.use(function(req,res,next) {
		res.header(
			'Access-Control-Allow-Headers',
			'x-access-token, Origin, Content-Type, Accept'
		);
		next();
	});
	

	//AUTORIZZAZIONE ACCESSO SPOTIFY OAUTH
	//inizializza processo oauth per spotify, collega account SongScrubber a
	//account spotify, richiede autorizzazioni per accesso a playlist.
	//Richiede un token jwt valido nella richiesta, fornito da /oauth/login
	//dopo aver creato un account. Dopo aver effettuato processo, SongScrubber
	//sara' autorizzato a modificare playlist dell'utente fino a revoca permessi
	//gestione access token e refresh token automatizzata.
	//
	//app.get('/oauth/spotify/login', [functions.tokenCheck], function(req, res) {
	app.get('/oauth/spotify/login', [functions.sessionCheck], function(req, res) {
		session = req.session;
		var state = generateRandomString(16);
		res.cookie(stateKey, state, {httpOnly: false});

		var scope = 'playlist-read-private playlist-modify-private playlist-modify-public';
		var rootUrl = 'https://accounts.spotify.com/authorize?';
		var options = {
			client_id: process.env.SPOTIFY_CLIENT_ID.toString(),
			scope: scope,
			response_type: 'code',
			redirect_uri: 'https://localhost:8443/oauth/spotify/callback',
			state: state
		}
		const query = new URLSearchParams(options)
		const redirUrl = rootUrl+query.toString();
		console.log(redirUrl);
		res.redirect(redirUrl);
	});

	//PATH CALLBACK SPOTIFY OAUTH
	//utilizzato esclusivamente da oauth spotify. Inizializza scrittura dati
	//accesso Spotify su DB, permettendo l'accesso ai dati playlist.
	app.get('/oauth/spotify/callback', async function(req, res) {
	    var code = req.query.code || null;
	    var state = req.query.state || null;
	    var storedState = req.cookies ? req.cookies[stateKey] : null;

	    console.log('[CALLBACK ROUTE SPOTIFY] CODE: '+code);
	    if (state === null || state !== storedState) {

	        res.redirect('/state_mismatch');
	    } else {
			res.clearCookie(stateKey);
			var authOptions = {
				code: code,
				redirect_uri: 'https://localhost:8443/oauth/spotify/callback',
				grant_type: 'authorization_code'
			}
			var query = new URLSearchParams(authOptions).toString();
			var data = await getSpotifyAccessToken(query);	
			req.body.user_id = req.cookies.user_id	

			console.log('[SPOTIFY CALLBACK] USER ID: '+req.body.user_id);

		        req.body.access_token = data.access_token;
		        req.body.expires_in = data.expires_in;
		    	req.body.refresh_token = data.refresh_token;
			req.body.data_id = await userController.getSpotifyData(req,res);
			console.log(req.body.access_token);
		        await spotifyController.updatePermissions(req,res);
		    	await userController.updateSpotifyTokens(req,res);
		    	console.log('dati correttamente salvati');
			res.redirect('/');
		}
	});

	//FUNZIONE PLAYLIST SCRUB
	//riceve JWT come x-access-token nell'header, playlist id nel body, ottiene i token spotify salvati per l'utente se presente (check), ottiene
	//playlist da spotify con chiamata api, itera su lista ottenuta per ottenere gli elementi da rimuovere
	//e poi rimuove gli elementi in lista 1 ad 1 con chiamate api verso spotify. restituisce 200 se andato a buon fine
	//accessibile solo tramite chiamate api con token jwt valido, necessario accesso a spotify
	app.post('/spotify/scrub_playlist/api', [functions.tokenCheck, functions.hasGivenSpotifyPerm],  async function(req, res){
		var tokenData = await userController.getSpotifyTokens(req, res)

		//check preliminare errori?
		

		//qui rabbitmq?
		rabbitfun.sendAPIData('spotify:'+req.body.playlist_id+':'+tokenData.accessToken);

		//implementiamo sistema che attende ack?

		res.status(202).send({message: 'richiesta API accettata'});
	});

	app.post('/spotify/scrub_playlist', [functions.sessionCheck, functions.hasGivenSpotifyPerm], async (req, res) => {
		var tokenData = await userController.getSpotifyTokens(req, res)

		//check preliminare errori?
		

		//qui rabbitmq?
		rabbitfun.sendAPIData('spotify:'+req.body.formUrl2+':'+tokenData.accessToken);

		res.status(202).send({message: 'richiesta API accettata'});
	});

	//FUNZIONE ELIMINA DATI SPOTIFY UTENTE
	//Riceve token JWT come x-access-token nell'header e cancella tutti i dati relativi
	//all'utente e spotify nel db. Restituisce 200 se andata a buon termine
	app.delete('/spotify/delete_access_data/api', [functions.tokenCheck], async function(req,res) {
		await userController.deleteSpotifyData(req,res);
		res.status(200).send({message: 'spotify data deleted'});
	})

	//COME SOPRA MA DESTINATA A FRONTEND
	app.delete('/spotify/delete_access_data', [functions.sessionCheck], async function(req,res) {
		await userController.deleteSpotifyData(req,res);
		res.redirect('/login/oauth');
	})

	app.get('/spotify/rmqtest', async function(req,res) {
		var data = await rabbitfun.sendAPIData('test:23vwg343hvsa:gibberishtoken');
		//aggiungi error handling
		return res.status(202).send({message: 'test in corso'});
	})
};

async function getSpotifyAccessToken(query) {
	var rootUrl = 'https://accounts.spotify.com/api/token';
	try {
		const result = await axios.post(rootUrl, query, {
			headers: {
				'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID.toString()
				+ ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		});
		return result.data;
	} catch(error) {
		console.log(error, "fallimento fetch token");
		throw new Error(error.message);
	}
}


