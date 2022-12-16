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
import superagent from 'superagent';

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
const spot_redirect_uri = 'localhost:3000/users/code';

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

app.get('/test', (req, res) => {
  res.render('test', {title: 'test'});
});

app.post('/test', function(req, res) {
	var item = req.body.formUrl; //TO DO: INPUT SANITIZATION
	console.log(item);
	var slug = item.split('track/').pop();
	console.log(slug);

	getSpotifyToken(spot_client_token_info, spot_client_auth_options);

	const new_data = '';
	var api_data_input = {
		hostname: 'api.spotify.com',
		port: 443,
		path: '/v1/tracks/' + slug + '?market=' + 'IT',  //TO DO: IMPLEMENTARE GEOAPI
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'Authorization': 'Bearer ' + spot_client_token_info.access_token
		}
	};

});
var spotStateKey = 'spotify_auth_state';


app.get('/spot/login', function(req, res) {
	var generateRandomString = function(length) {
		var text = '';
		var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		
		for (var i = 0; i < length; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	};
	var state = generateRandomString(16);
	res.cookie(spotStateKey, state);
	var spotStateKey = 'spotify_auth_state';
	var scope = 'user-read-private user-read-email'; //DA SOSTITUIRE CON SCOPE UTILE OVVIAMENTE
	res.redirect('https://accounts.spotify.com/authorize?' +
		queryString.stringify({
		response_type: 'code',
		client_id: process.env.SPOTIFY_CLIENT_ID,
		scope: scope,
		redirect_uri: spot_redirect_uri,
		state: state
	}));
});




app.get('/token', async function (req, res, next) {


	let base_url = 'https://accounts.spotify.com'
	let authentication_url = '/authorize'
	let client_id = '&client_id=process.env.SPOTIFY_CLIENT_ID'
	let response_type = '?response_type=code'
	let redirect_uri = '&redirect_uri=localhost:3000/users/code'
	let state = '&state=34fFs29kd09'
	let scope = '&scope=user-read-private user-read-email playlist-modify-public playlist-modify-private playlist-read-collaborative playlist-read-private'
  
  
	let code_request_url = base_url + authentication_url + response_type + client_id + scope + redirect_uri + state
  
  
	let response = await api.get(code_request_url).catch(err => { console.log(err) })
	console.log(response)
  
  
  
	res.redirect(code_request_url)
  
  
  });


  app.get(['/code', '/:'], async function (req, res) {
	let code = req.query.code
	let token_base_url = 'https://accounts.spotify.com/api/token'
	let grant_type = 'authorization_code'
	let redirect_uri = 'localhost:3000/users/code'
  
  
  
	let access_token = await api.request({
	  url: token_base_url,
	  method: 'post',
	  params: {
		'grant_type': grant_type,
		'code': code,
		'redirect_uri': redirect_uri,
	  },
  
  
	  headers:
	  {
		'content-type': 'application/x-www-form-urlencoded',
		'authorization': 'Basic ' + process.env.SPOTIFY_CLIENT_SECRET
	  }
  
  
  
	}).catch(err => console.log(err))
  
  
  
	let username = await api.request({
	  url: 'https://api.spotify.com/v1/me',
	  method: 'get',
  
  
	  headers:
	  {
		'content-type': 'application/x-www-form-urlencoded',
		'authorization': 'Bearer ' + access_token.data.access_token
	  }
	}).catch(err => console.log(err))
  
  
	res.cookie('session_user', username.data.id)
	res.cookie('access_token', access_token.data.access_token)
	res.cookie('refresh_token', access_token.data.refresh_token)
	res.render('index', { title: "Spotify Themes App" })
  
  
});

console.log('in ascolto su 3000');
app.listen(3000);