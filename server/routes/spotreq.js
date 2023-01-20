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

//		console.log('[SPOTIFY INITIAL SETUP 1] USERID: '+ req.cookie(user_id))	
//		console.log('[SPOTIFY INITIAL SETUP 2] USERID: '+ req.cookie.user_id)
		console.log('[SPOTIFY INITIAL SETUP 3] USERID: '+ req.body.user_id)

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

			console.log('[SPOTIFY CALLBACK] USER ID: '+req.body.user_id);

		        req.body.access_token = data.access_token;
		        req.body.expires_in = data.expires_in;
		    	req.body.refresh_token = data.refresh_token;
			req.body.data_id = await userController.getSpotifyData(req,res);
			console.log(req.body.access_token);
		        await spotifyController.updatePermissions(req,res);
		    	await userController.updateSpotifyTokens(req,res);
		    	console.log('dati correttamente salvati');
			res.redirect('/test');
		}
	});

	//app.post('/spotify/scrub_playlist', [functions.tokenCheck, functions.hasGivenSpotifyPerm],  async function(req, res){
	app.post('/spotify/scrub_playlist', [functions.tokenCheck],  async function(req, res){
//		res.render('get_playlist', {title: 'Get playlist'});
		var tokenData = await userController.getSpotifyTokens(req, res)
		const req_options = {
			playlist_id: req.body.playlist_id,
			market: 'IT',
			access_token: tokenData.accessToken 
		}
		const result = await getPlaylist(req_options);
		console.log('spotify scrub playlist response: '+result);
		console.log('spotify scrub playlist response items: '+result.items);

		const daRimuovere = elementiDaRimuovere(result.items);
		console.log('n i c e');
		console.log(daRimuovere);

		const resRimozione = await snocciolaPlaylist(req_options,daRimuovere);

		res.status(200).send(result);
	});

	//SEMPLICE FUNZIONE TEST
	app.get('/test', async function(req,res) {
		session = req.session
		req.body.user_id = req.cookies.user_id

		var dati = await userController.getData(req,res);

		console.log('[TEST] dati: '+dati);

		res.status(200).send({res: dati});
	});
};

function elementiDaRimuovere(tracks) {
	var removeTrack = new Array();
	var cnt = 0;
	tracks.forEach(function(trackData) {
		cnt = cnt+1
		console.log('elementi in traccia: '+Object.keys(trackData.track))
		console.log('TRACCIA TROVATA IN PLAYLIST NUMERO '+cnt+', traccia: '+trackData.track.name);
		if (trackData.track.is_playable === false) {
			removeTrack.push({uri: trackData.track.uri});
		}
	})
	return removeTrack;
}

async function snocciolaPlaylist(req_options,uris) {
	const rootUrl = 'https://api.spotify.com/v1/playlists/'+req_options.playlist_id+'/tracks?market='+req_options.market
	try {
		var res = await axios.delete(rootUrl, {
			headers: {
				'Content-Type': 'applications/json',
				'Authorization': 'Bearer ' + req_options.access_token
			},
			data: {
				tracks: uris,
			},
		});
		return res
	} catch(error) {
		console.log(error, 'fallimento eliminazione elementi');
		throw new Error(error.message);
	}
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

async function getPlaylist(req_options) {
	const rootUrl = 'https://api.spotify.com/v1/playlists/'+ req_options.playlist_id+'/tracks'+'?market='+ req_options.market
	try {
		var res = await axios.get(rootUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + req_options.access_token
			},
		});
		return res.data
	} catch(error) {
		console.log(error, 'fallimento fetch playlist da spotify');
		throw new Error(error.message);
	}
	
//	})
//	.then((res) => {
//		return res.data;
//	})
//	.catch((error) => {
//		console.log('errore richiesta playlist: ',error.response)
//	})
}
