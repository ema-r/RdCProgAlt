import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
dotenv.config();
import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import path from 'path';
import http from 'http';
import https from 'https';
import cors from 'cors';
import queryString from 'query-string';
import passport from 'passport';
import axios from 'axios';

//const passport = require('./config/passport');
//const { ensureUser } = require('./middlewares/auth');
//const homepageRoutes = require('./routes/homepage');
//const oauthRoutes = require('./routes/oauth');
//const apiRoutes = require('./routes/post');

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const INSTANCE = process.env.INSTANCE || '';
const MONGO_URI = process.env.MONGO_URI || '';
const PORT = process.env.PORT || 3001;
const SPOT_TOKEN = process.env.SPOTIFY_OAUTH_TOKEN;
const SESSION_OPTIONS = {
  cookie: {
    /* cookie's lifetime: 4h */
    maxAge: 1000 * 60 * 60 * 4,
    secure: false,
  },
  resave: false,
  saveUninitialized: true,
  secret: process.env.SECRET || '',
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
};

var spot_client_auth_options = {
	url: 'https://accounts.spotify.com/api/token',
	method: 'POST',
	headers: {
		'Authorization': 'Basic ' + (new Buffer(process.env.SPOTIFY_client_id 
			+ ':' + process.env.SPOTIFY_client_secret).toString('base64')),
		'Content-Type': 'application/x-www-form-urlencoded' 
	},
	form: {
		grant_type: 'client_credentials'
	},
	json: true
};
var spot_client_token_info = {
	'access_token' : '',
	'expires_at' : 0
};

const spot_client_id = process.env.SPOTIFY_CLIENT_ID;
const spot_client_sc = process.env.SPOTIFY_CLIENT_SECRET;
const spot_redirect_uri = 'http://localhost:8080/spot/callback';

const app = express();

/* set view engine */
app.set('view engine', 'ejs');

/* set middlewares */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(SESSION_OPTIONS));
app.use(cors());

/* initialize passport */
app.use(passport.initialize());
app.use(passport.session());

///* set routes */
//app.use('/api/v1/post', apiRoutes);
//app.use('/homepage', homepageRoutes);
//app.use('/oauth/google', oauthRoutes);

/* get root path */
app.get('/', (req, res) => {
  res.render('index', { title: 'SongLify' });
});

/* get API docs */
app.use('/api-docs', express.static(path.join(__dirname, '/public/docs')));

/* set connection with mongo */
mongoose
  .connect(MONGO_URI)
  .then((result) => {
    console.log(`${INSTANCE} -> ${result.connection.host}`);
    app.listen(3001, () => {
      console.log(`${INSTANCE} -> ${3001}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
  });
//GOOGLE OAUTH

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
	const {id_token, access_token} = await getGoogleOAuthToken({code});
	console.log({id_token, access_token});
}

async function getGoogleOAuthToken(code) {
	const rootUrl = "https://oauth2.googleapis.com/token?";
	const options = {
		code,
		client_id: process.env.GOOGLE_CLIENT_ID.toString(),
		client_secret: process.env.GOOGLE_CLIENT_SECRET.toString(),
		redirect_uri: process.env.GOOGLE_REDIRECT_URI.toString(),
		grant_type: 'authorization_code',
	};

	try {
		const res = await axios.post(rootUrl, queryString.stringify(options), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
		return res.data
	} catch(error) {
		console.log(error, 'fallimento fetch token');
		throw new Error(error.message);
	}
}

app.get('/googlelogin', (req, res) => {
	res.render('googlelogin');
});
app.get('/googlelogin/init', (req, res) => {
	res.redirect(getGoogleOAuthURL());
});
app.get('/oauth/google/login', (req, res) => {
	const code = req.query.code.toString();
	handlerGoogleOAuth(code);
});

//SPOTIFY OAUTH, PROBABILMENTE DA MUOVERE IN UN NUOVO FILE AUSILIARIO

//genera stringa randomica di lunghezza specifica utilizzando i caratteri forniti. 
//Richiesta da spotify per processo oauth user e molto facilmente mossa in un'altro
//file .js per funzioni 'helper'
var generateRandomString = function(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};



console.log('in ascolto su 3000');
app.listen(3000);
