const functions = require('./../functions/jwtfun');
const googleController = require('./../controllers/googlecontr.js')
const userController = require('./../controllers/sessioncontr.js');
const axios = require('axios');
const dotenv = require('dotenv').config('./../.env');

module.exports = function(app) {
	app.use(function(req,res,next) {
		res.header(
			'Access-Control-Allow-Headers',
			'x-access-token, Origin, Content-Type, Accept'
		);
		next();
	});
	//INIZIALIZZA LOGIN CON GOOGLE
	//controlla token identita' songscrubber (e ricava user id da esso)
	//genera oauth url per google e redirige
	//
	//REIMPLEMENTARE CHECK AUTENTICAZIONE, CON NUOVA FUNZ TOKEN UTENTE
	//app.get('/googlelogin/init', [functions.tokenCheck], (req, res) => {
	app.get('/googlelogin/init', (req, res) => {
		res.redirect(getGoogleOAuthURL());
	});
	
	//GOOGLE CALLBACK
	//Redirige qui dopo aver accettato login e scope.
	//deve ottenere token di accesso con codice, che poi salva nel nostro
	//db
	app.get('/oauth/google/login', async (req, res) => {
		const code = req.query.code;
		console.log('[GOOGLE CALLBACK ROUTE] code: '+code)
		var tokens = await handlerGoogleOAuth(code);
	
		const id_token = tokens.id_token;
		const access_token = tokens.access_token;
		const refresh_token = tokens.refres_token;
		const expires_in = tokens.expires_in
	
		console.log("[GOOGLE CALLBACK ROUTE] "+id_token);
		console.log("[GOOGLE CALLBACK ROUTE] "+access_token);
		console.log("[GOOGLE CALLBACK ROUTE] "+refresh_token);
	
		req.body.google_id_token = id_token;
		req.body.google_access_token = access_token;
		req.body.google_refresh_token = refresh_token;
		req.body.google_expires_in = expires_in;

		var result = await userController.updateGoogleTokens(req,res);
	
		//solo per test, puo essere tranquillamente rimosso piu avanti
		const googleUser2 = await getGoogleUser({id_token, access_token})
		req.body.user_id = req.cookies.user_id;
	
		//aggiorna permessi nel nostro db
		await googleController.updatePermissions(req,res);
		res.redirect('/');
	});
	
	//YOUTUBE SCRUB PLAYLIST
	//app.get('/youtube/scrub_playlist/JSON', [functions.tokenCheck, functions.hasGivenYoutubePerm], async (req, res) => {
	//	var access_token = await userController.getAccessToken(req,res);
	//	console.log('[SCRUB PLAYLIST] ACCESS TOKEN TROVATO :'+access_token);
	//	const req_options = {
	//		playlist_id: req.body.playlist_id,
	//		api_key: process.env.GOOGLE_API_KEY,
	//		access_token: access_token
	//	}
	//	const result = await getPlaylist(req_options);
	//	console.log(JSON.stringify(result));
	//});	
	app.post('/youtube/scrub_playlist/api',  [functions.tokenCheck], async (req, res) => {
		var tokenData = await userController.getGoogleTokens(req,res);

		const req_options = {
			playlist_id: req.playlist_id,
			access_token: tokenData.accessToken
		}
		const result = await getPlaylist(req_options);

		//SAREBBE BUONA IDEA CREARE SINGOLA FUNZIONE DI ERROR HANDLING
		if (result.status === 404) {
			res.status(404).send({message: 'playlist non trovata'})
		}
		if (result.status < 200 || result.statusCode > 299) {
			res.status(500).send({message: 'errore'});
		}
		console.log(result.data);
		var daRimuovere = await elementiDaRimuovere(tokenData.accessToken, result.data.items);

		res.status(200).send({message: 'finito'});
		
	});

	
	//elimina dati utente relativi a youtube (id token, access token, refresh token) tramite 
	//chiamata API REST. Richiede token JWT valido
	app.delete('/youtube/delete_access_data/api', [functions.tokenCheck], async function(req,res) {
		await userController.deleteYoutubeData(req,res);
		res.status(200).send({message: 'spotify data deleted'});
	})


	//elimina dati utente relativi a youtube (id token, access token, refresh token). Richiede 
	//sessione valida
	app.delete('/youtube/delete_access_data', [functions.sessionCheck], async function(req,res) {
		await userController.deleteYoutubeData(req,res);
		res.redirect('/login/oauth');
	})
	
}

async function elementiDaRimuovere(token, elements) {
	var cnt = 0;
	elements.forEach(async function(videoData) {
		cnt = cnt+1
		if (!isVideoAvailable(token, videoData)) {
			await rimuoviVideo(token, videoData);
		}
	})
	return res.status(200).send({message:'finito'});
}

async function rimuoviVideo(token, videoData) {
	const rootUrl = 'https://www.googleapis.com/youtube/v3/playlistItems?id='+videoData.id+'&access_token='+token;
	try {
		var res = await axios.get(rootUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer'+token
			}
		});
		return res;
	} catch(error) {
		console.log('errore DELETE elemento da playlist')
		res.status(500).send({message: errore});
	}
}

async function isVideoAvailable(token, videoData) {
	if (videoData.status.uploadStatus === 'deleted' || videoData.status.privacyStatus === 'private') {
			return false;
	}
	return true;
}

async function getPlaylist(req_options){
	const rootUrl = 'https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails%2Cstatus%2Cid&playlistId=PLiN-7mukU_RF0TJ1EpG-9zOVTjDFjWlIs&access_token='+req_options.access_token+'&maxResults=50';
	try {
		var res = await axios.get(rootUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + req_options.access_token
			}
		});
		return res;
	}catch(error) {
		console.log('errore richiesta canzone: ', error.response)
	}
}

function getGoogleOAuthURL() {
	const rootUrl = 'https://accounts.google.com/o/oauth2/auth?'
	const options = {
		redirect_uri: process.env.GOOGLE_REDIRECT_URI.toString(),
		client_id: process.env.GOOGLE_CLIENT_ID.toString(),
		access_type: 'offline',
		response_type: 'code',
		prompt: 'consent',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/youtube'
		].join(" "),
	}

	const querystr = new URLSearchParams(options);

	const retUrl = rootUrl+querystr.toString();
	console.log(retUrl);

	return retUrl;
}

async function handlerGoogleOAuth(code) {
	var tokens = await getGoogleOAuthToken(code);
	console.log('[HANDLER]: '+ tokens.id_token);
	console.log('[HANDLER]: '+ tokens.access_token);
	console.log('[HANDLER]: '+ tokens.refresh_token);
	const data = {
		id_token: tokens.id_token,
		access_token: tokens.access_token,
		refresh_token: tokens.refresh_token,
		expires_in: tokens.expires_in
	}	
	return data;
}

async function getGoogleOAuthToken(code) {
	const rootUrl = "https://oauth2.googleapis.com/token";
	const options = {
		code,
		client_id: process.env.GOOGLE_CLIENT_ID.toString(),
		client_secret: process.env.GOOGLE_CLIENT_SECRET.toString(),
		redirect_uri: "https://localhost:8443/oauth/google/login",
		grant_type: 'authorization_code',
	};
	try {
		const res = await  axios.post(rootUrl,options, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},		
		});
		console.log('[TOKEN DI GOOGLE]: '+res);
		return res.data
	} catch(error) {
		console.log(error, 'fallimento fetch token');
	}
};
