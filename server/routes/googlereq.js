const functions = require('./../functions/jwtfun');
const googleController = require('./../controllers/googlecontr.js')
const userController = require('./../controllers/sessioncontr.js');
const axios = require('axios');
const dotenv = require('dotenv').config('./../.env');

const rabbitfun = require('./../functions/rabbitfun');

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
	app.get('/googlelogin/init', [functions.sessionCheck], (req, res) => {
		res.redirect(getGoogleOAuthURL());
	});
	
	//GOOGLE CALLBACK
	//Redirige qui dopo aver accettato login e scope.
	//deve ottenere token di accesso con codice, che poi salva nel nostro
	//db
	app.get('/oauth/google/login', async (req, res) => {
		const code = req.query.code;
		var tokens = await handlerGoogleOAuth(code);
	

		const id_token = tokens.id_token;
		const access_token = tokens.access_token;
		const refresh_token = tokens.refres_token;
		const expires_in = tokens.expires_in
	
		req.body.google_id_token = id_token;
		req.body.google_access_token = access_token;
		req.body.google_refresh_token = refresh_token;
		req.body.google_expires_in = expires_in;


		//solo per test, puo essere tranquillamente rimosso piu avanti
		req.body.user_id = req.cookies.user_id;
		var result = await userController.updateGoogleTokens(req,res);
	
	
		//aggiorna permessi nel nostro db
		await googleController.updatePermissions(req,res);
		res.redirect('/');
	});
	
	//YOUTUBE SCRUB PLAYLIST	
	//riceve JWT come x-access-token nell'header, playlist_id nel body, ottiene i token google salvati per l'utente se presente (check), ottiene
	//playlist da google con chiamata api, itera su lista ottenuta per ottenere gli elementi da rimuovere
	//e poi rimuove gli elementi in lista 1 ad 1 con chiamate api verso google. restituisce 202 accettato
	//accessibile solo tramite chiamate api con token jwt valido, necessario accesso a google
	app.post('/youtube/scrub_playlist/api',  [functions.tokenCheck, functions.hasGivenYoutubePerm], async (req, res) => {
		var tokenData = await userController.getGoogleTokens(req,res);
		
		rabbitfun.sendAPIData('youtube:'+req.body.playlist_id+':'+tokenData.accessToken);


		res.status(202).send({message: 'richiesta API accettata'});
		
	});

	app.post('/youtube/scrub_playlist', [functions.sessionCheck, functions.hasGivenYoutubePerm] ,async (req, res) => {
		var tokenData = await userController.getGoogleTokens(req,res);
		var userData = await userController.getData(req,res);
		console.log('USERDATA '+userData);
		rabbitfun.sendAPIData('youtube:'+req.body.formUrl1+':'+tokenData.accessToken);
		res.status(202).send({message: 'richiesta API accettata'});
		
	});

	//elimina dati utente relativi a youtube (id token, access token, refresh token) tramite 
	//chiamata API REST. Richiede token JWT valido passato come x-access-token nell'header
	app.delete('/youtube/delete_access_data/api', [functions.tokenCheck], async function(req,res) {
		await userController.deleteYoutubeData(req,res);
		res.status(200).send({message: 'spotify data deleted'});
	})


	//elimina dati utente relativi a youtube (id token, access token, refresh token). Richiede 
	//sessione valida
	app.post('/youtube/delete_access_data', [functions.sessionCheck], async function(req,res) {
		await userController.deleteYoutubeData(req,res);
		console.log("Dati youtube cancellati");
		res.redirect('/');
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
	var tokens = await getGoogleOAuthToken(code);
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
