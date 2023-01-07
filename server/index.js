require('dotenv').config()
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');
const express = require('express');
const sessions = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const https = require('https');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const { dirname } = require('path');
const mailer = require('nodemailer');
const {URL} = require('url');
const axios = require('axios');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const INSTANCE = process.env.INSTANCE || '';
const MONGO_URI = process.env.MONGO_URI || '';
const PORT = process.env.PORT || 3001;
const SPOT_TOKEN = process.env.SPOTIFY_OAUTH_TOKEN;


const controller = require('./controllers/sessioncontr');
const functions = require('./functions/exported');

//mongoose.connect(MONGO_URI+'/'+process.env.MONGO_DB_NAME+'?authSource=admin', {
//	useNewUrlParser: true,
//	useUnifiedTopology: true,
//	useFindAndModify: false,
//	useCreateIndex: true
//});
//
//mongoose.connection
//	.on("open", () => console.log("MONGOOSE UP AND RUNNING"))
//	.on("close", () => console.log("MONGOOSE CONNECTION CLOSED"))
//	.on("error", (error) => {
//		console.log(error);
//		process.exit();
//});

var generateRandomString = function(length) { //FUNZIONE VA SPOSTATA IN FUNCTIONS
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

var stateKey = 'spotify_auth_state'

const app = express();
app.use(express.static(path.join(__dirname, 'public')))
app.use(cors({
	origin: 'https://localhost:8443',
}));
app.use(express.static(path.join(__dirname, '/public/css')));
app.use(express.static(__dirname + 'public'));
app.use(express.static('public'));
app.use(express.static('models'));
const oneDay = 1000 * 60 * 60 * 24;
//app.use(sessions({
////	genid: (req) => {
////		return uuidv4()
////	},
//	secret: 'keyboard cat',
//	store: MongoStore.create({
//		mongoUrl: MONGO_URI,
//		dbName: process.env.MONGO_DB_NAME,
//		collectionName: "sessions",
//		stringify: false,
//		autoRemove: "interval",
//		autoRemoveInterval: 1
//	}),
//  	resave: true,
//  	saveUninitialized: false,
//  	cookie: { secure: true , maxAge: oneDay}
//}));

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/static', express.static(path.join(__dirname, '/views/partials')));
app.set('view engine', 'ejs');
//app.use(express.json())
//app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

//MONGODB
var userModel = require("./models/userv2.model")
var spotifyModel = require("./models/userv2_spotify_data.model")
var youtubeModel = require("./models/userv2_youtube_data.model")
mongoose
	.connect(MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		console.log("MONGOOSE, UP AND RUNNING");
		initialize();
	})
	.catch(err => {
		console.error("ERRORE CONNESSIONE MONGOOSE", err);
		process.exit();
	});

function initialize() {
	userModel.estimatedDocumentCount((err, count) => {
		if (!err && count === 0) {
			new userModel({
				uname: "dev",
				pword: bcrypt.hashSync('devpass', 8),
				api_id: generateRandomString(16),
				api_sc: generateRandomString(64),
				spotify_data: new spotifyModel(),
				youtube_data: new youtubeModel()
			}).save(err => {
				if (err) { console.log('salvataggio modello dummy fallito:', err) }
			})
			console.log('db inizializzato con dummy dev model [NON INTESO PER PRODUCTION]')
		}
	});
}

/* get root path */
app.get('/', (req, res) => {
  res.render('index', { title: 'SongLify' });
});

//test user var
var session;

require('./routes/usermng')(app);
require('./routes/userreq')(app);
require('./routes/spotreq')(app);

app.get('/oauth/logout', (req, res) => {
	req.session.destroy();
	console.log("Sloggato con successo");
	res.redirect("https://localhost:8443");
});

app.post('/spotify/try_logged', (req, res) => {
	session = req.session;
	console.log("Loggato con successo con Spotify")
	res.redirect("https://localhost:8443/spotify/recap");
});

app.get('/spotify/recap', (req,res) => {
	session = req.session
	res.render(href="partials/spotify_recap")
});

/* get API docs */
app.use('/api-docs', express.static(path.join(__dirname, '/public/docs')));



//GOOGLE OAUTH
//POSSIBILE MODULO ESTERNO INIZIO

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
			'https://www.googleapis.com/auth/userinfo.email',
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
//possibile modulo esterno FINE
app.get('/googlelogin', (req, res) => {
	res.render('googlelogin');
});
app.get('/googlelogin/init', (req, res) => {
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

//app.post('/spot/get_playlist', async (req, res) => {
//	var item = req.body.formUrl;
//	var slug = item.split('playlist/').pop();\
//
//	const req_options = {
//		playlist_id: slug,
//		market: 'IT', //placeholder
//		access_token: spotify_access_token
//	}
//	const playlistInfo = await getPlaylist(req_options);
//}) 
//
//async function getPlaylist(options) {
//	const rootUrl = 'https://api.spotify.com/v1/playlists/'+options.playlist_id+'?market='+options.market
//	try {
//		const res = await axios.get(rootUrl, {
//			headers: {
//				'Content-Type': 'application/json',
//				'Authorization': 'Bearer'+options.access_token
//			}
//		});
//		return res.data
//	} catch(error) {
//		console.log('errore fetch playlist: '+error);
//		throw new Error(error.message)
//	}
//}
//new begin /form

console.log('in ascolto su 3000');
app.listen(3000);
