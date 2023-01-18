const functions = require('./../functions/jwtfun');
const spotifyController = require('./../controllers/spotifycontr.js')
const userController = require('./../controllers/sessioncontr.js');
const axios = require('axios');
const dotenv = require('dotenv').config('./../.env');
const {URLSearchParams} = require('url');

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
	app.get('/oauth/spotify/login', function(req, res) {
		session = req.session;
		var state = generateRandomString(16);
		res.cookie(stateKey, state, {httpOnly: false});

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

	//app.post('/spotify/scrub_playlist', [functions.tokenCheck, functions.hasGivenSpotifyPerm],  async function(req, res){
	app.post('/spotify/scrub_playlist', [functions.tokenCheck],  async function(req, res){
//		res.render('get_playlist', {title: 'Get playlist'});
		//TODO: rimedia access token da JWT token, refresh se necessario
		var access_token = await userController.getSpotifyTokens(req, res) //da vedere cosa passare, tutta req sembra piuttosto "grande"
		console.log(access_token);
		const req_options = {
			playlist_id: req.body.playlist_id,
			market: 'IT',
			access_token: access_token
		}
		const result = await getPlaylist(req_options);
		console.log(JSON.stringify(result));
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

function getPlaylist(req_options) {
	console.log(req_options);
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
