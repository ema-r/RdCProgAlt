const functions = require('./../functions/jwtfun');
const googleController = require('./../controllers/googlecontr.js')
const userController = require('./../controllers/sessioncontr.js');
const axios = require('axios');
const dotenv = require('dotenv').config('./../.env');

module.exports = function(app) {

	//possibile modulo esterno FINE
	app.get('/googlelogin/init',[functions.tokenCheck], (req, res) => {
		res.redirect(getGoogleOAuthURL());
	});
	
	//Redirige qui dopo aver accettato login e scope
	app.get('/oauth/google/login', async (req, res) => {
		const code = req.query.code;
		console.log('[CALLBACK] code: '+code)
		var tokens = await handlerGoogleOAuth(code);
	
		const id_token = tokens.id_token;
		const access_token = tokens.access_token;
	
		console.log("[CALLBACK] "+id_token);
		console.log("[CALLBACK] "+access_token);
	
	
		const googleUser2 = await getGoogleUser({id_token, access_token})
		console.log("google user trovato: "+JSON.stringify(googleUser2));
	
		res.redirect('/');
	});

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
		redirect_uri: process.env.GOOGLE_REDIRECT_URI.toString(),
		grant_type: 'authorization_code',
	};

	try {
		const res = await axios.post(rootUrl, JSON.stringify(options), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
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
