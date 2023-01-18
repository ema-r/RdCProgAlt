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
	
		console.log("[GOOGLE CALLBACK ROUTE] "+id_token);
		console.log("[GOOGLE CALLBACK ROUTE] "+access_token);
	
		req.body.google_id_token = id_token;
		req.body.google_access_token = access_token;
		//updateGoogleTokens(req,res);
	
		//solo per test, puo essere tranquillamente rimosso piu avanti
		const googleUser2 = await getGoogleUser({id_token, access_token})
		console.log("google user trovato: "+JSON.stringify(googleUser2));
	
		//aggiorna permessi nel nostro db
		googleController.updatePermissions(req,res);
		res.redirect('/');
	});
	
	//YOUTUBE SCRUB PLAYLIST
	app.get('/youtube/scrub_playlist', [functions.tokenCheck, functions.hasGivenYoutubePerm], async (req, res) => {
		return
	})
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
	console.log(code);
	const {id_token, access_token} = await getGoogleOAuthToken(code);
	console.log('[HANDLER]: '+ id_token);
	console.log('[HANDLER]: '+ access_token);
	var data = {
		id_token: id_token,
		access_token: access_token
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
		console.log(res);
		return res.data
	} catch(error) {
		console.log(error, 'fallimento fetch token');
	}
};


async function getGoogleUser({id_token, access_token}) {
	try {
		const res = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token='+access_token, {
			headers: {
				Authorization: 'Bearer '+id_token
			}
		})
		return res.data
	} catch(error) {
		console.log(error, "ERRORE RITORNO DATI UTENTE");
		throw new Error(error.message);
	}
}
