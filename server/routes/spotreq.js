const functions = require('./../functions/jwtfun');
const spotifyController = require('./../controllers/spotifycontr.js')
const userController = require('./../controllers/sessioncontr.js');
const axios = require('axios');
const dotenv = require('dotenv').config('./../.env');

var generateRandomString = function(length) {  //va spostata in functions, per ora e' qui
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

var stateKey = ''

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
	app.get('/oauth/spotify/login', [functions.tokenCheck], function(req, res) {
		session = req.session;
		var state = generateRandomString(16);
		res.cookie(stateKey, state);

		var scope = '';
		var rootUrl = 'https://accounts.spotify.com/authorize?';
		var options = {
			client_id: process.env.SPOTIFY_CLIENT_ID.toString(),
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
	
	    if (code === null) {
	   // if (code === null || state !== storedState) {
	        res.redirect('/state_mismatch');
	    } else {
			res.clearCookie(stateKey);
			var authOptions = {
				code: code,
				redirect_uri: 'https://localhost:8443/oauth/spotify/callback',
				grant_type: 'authorization_code'
			}
			var query = new URLSearchParams(authOptions).toString();
			data = await getSpotifyAccessToken(query);
			console.log(JSON.stringify(data));		
		
			
			//AGGIUNGI MODIFICA DB QUI
		    	console.log(req.body.user_id)
		        req.body.access_token = data.access_token;
		        req.body.expires_in = data.expires_in;
		    	req.body.refresh_token = data.refresh_token;

		        spotifyController.updatePermissions(req,res);
		    	userController.updateSpotifyTokens(req,res);
//			res.redirect('/');
		}
	});

	app.post('/spotify/scrub_playlist', [functions.tokenCheck, functions.hasGivenSpotifyPerm],  async function(req, res){
//		res.render('get_playlist', {title: 'Get playlist'});
		//TODO: rimedia access token da JWT token, refresh se necessario
		var access_token = userController.getSpotifyToken(req, res) //da vedere cosa passare, tutta req sembra piuttosto "grande"
		const req_options = {
			playlist_id: req.body.playlist_id,
			market: 'IT',
			access_token: access_token
		}
		const result = await getPlaylist(req_options);
	});
};

async function getSong(song_id, access_token) {
	const rootUrl = 'https://api.spotify.com/v1/tracks/'+song_id+'?market=IT'
	const res = axios.get(rootUrl, {
		headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + access_token
			}
	})
	.then((res) => {
		console.log('response',res.data)
		})
	.catch((error) => {
		console.log('errore riciesta canzone: ',error.response)
	})
}

async function getSpotifyAccessToken(query) {
	var rootUrl = 'https://accounts.spotify.com/api/token';
	try {
		const res = await axios.post(rootUrl, query.toString(), { 
			headers: {
				'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID.toString()
				+ ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		},
		{ withCredentials: true });
		return res.data;
	} catch(error) {
		console.log(error, "fallimento fetch token");
		throw new Error(error.message);
	}
}

function getPlaylist(req_options) {
	const rootUrl = 'https://api.spotify.com/v1/playlists/'+ req_options.playlist_id+'?market='+ req_options.market
	const res = axios.get(rootUrl, {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + req_options.access_token
		}
	}, 
	{ withCredentials: true })
	.then((res) => {
		console.log('response',res.data)
	})
	.catch((error) => {
		console.log('errore riciesta canzone: ',error.response)
	})
}
