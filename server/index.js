require('dotenv').config()
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const https = require('https');
const cors = require('cors');
const passport = require('passport');
const spotify = require('passport-spotify');
const cookieParser = require("cookie-parser");
const { dirname } = require('path');
const mailer = require('nodemailer');
const spotifyAuth = require('./middlewares/spotify-auth');
const {URL} = require('url');
const axios = require('axios');
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = 'https://localhost:8443/spot/callback';
const spot_client_id = process.env.SPOTIFY_CLIENT_ID;
const spot_client_sc = process.env.SPOTIFY_CLIENT_SECRET;
const spot_redirect_uri = 'https://localhost:8443/spot/callback';
const port = new URL(redirect_uri).port;
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
  }
);

var generateRandomString = function(length) {
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
.use(cors())
.use(spotifyAuth({client_id, client_secret, redirect_uri}));
app.use(express.static(path.join(__dirname, '/public/css')));
app.use(express.static(__dirname + 'public'));
app.use(express.static('public'));
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/static', express.static(path.join(__dirname, '/views/partials')));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(SESSION_OPTIONS));
app.use(cors());
app.use(express.static('public'));

/* get root path */
app.get('/', (req, res) => {
  res.render('index', { title: 'SongLify' });
});

/* get API docs */
app.use('/api-docs', express.static(path.join(__dirname, '/public/docs')));


/* PASSPORT FUNCTIONS */

const SpotifyStrategy = require('passport-spotify').Strategy;
passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());
app.get('/spot', passport.authenticate('spotify'));

passport.use( new SpotifyStrategy( {
	clientID: process.env.SPOTIFY_CLIENT_ID,
    	clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    	callbackURL: 'https://localhost:8443'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
	    process.nextTick(function () {
		return done(null, profile);
	    });
    }
  )
);

app.use(session({
	secret: 'keyboard cat',
  	resave: false,
  	saveUninitialized: false,
  	cookie: { secure: true }
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });

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
		const res = await axios.post(rootUrl, queryString.stringify(options), {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});
		return res.data
	} catch(error) {
		console.log(error, 'fallimento fetch token');
});

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


//spotufy

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

app.get('/oauth/spot/login', function(req, res) {
	var state = generateRandomString(16);
	res.cookie(stateKey, state);

	var scope = '';
	var rootUrl = 'https://accounts.spotify.com/authorize?';
	var options = {
		client_id: process.env.SPOTIFY_CLIENT_ID,
		response_type: 'code',
		redirect_uri: 'https://localhost:8443/spot/callback',
		state: state
	}
	const query = new URLSearchParams(options)
	const redirUrl = rootUrl+query.toString();
	res.redirect(redirUrl);
});

app.get('/spot/callback', async function(req, res) {
	var code = req.query.code || null;
	var state = req.query.state || null;
	var storedState = req.cookies ? req.cookies[stateKey] : null;

	if (state === null || state !== storedState) {
		res.redirect('/state_mismatch');
	} else {
		res.clearCookie(stateKey);
		var authOptions = {
			code: code,
			redirect_uri: 'https://localhost:8443/spot/callback',
			grant_type: 'authorization_code'
		}
		var query = new URLSearchParams(authOptions).toString();
		data = await getSpotifyAccessToken(query);
		console.log(JSON.stringify(data));
		res.redirect('/');
	}
});

async function getSpotifyAccessToken(query) {
	var rootUrl = 'https://accounts.spotify.com/api/token';
	try {
		const res = await axios.post(rootUrl, query.toString(), { headers: {
			'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID.toString()
								+ ':' + process.env.SPOTIFY_CLIENT_SECRET.toString())									  .toString('base64')),
			'Content-Type': 'application/x-www-form-urlencoded'
			},
		});
		return res.data;
	} catch(error) {
		console.log(error, "fallimento fetch token");
		throw new Error(error.message);
	}
}


app.use(passport.authenticate('session'));


app.post(
	'/form',
	passport.session(),
	async function(req, res){
		var item = (req.body.formUrl1).split('track/').pop();
		var access_token = passport.authenticate('spotify', {scope: ['user-read-email']}).access_token;
		console.log(access_token);
		const req_options = {
			song_id: "5C7rx6gH1kKZqDUxEI6n4l",
			market: 'IT',
			access_token: access_token
		}
		const result = await getSong(req_options);
	});
	
	function getSong(req_options) {
		const rootUrl = 'https://api.spotify.com/v1/tracks/'+ req_options.song_id+'?market='+ req_options.market
			const res = axios.get(rootUrl, {
			headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + req_options.access_token
				}
			})
			.then((res) => {
				console.log('response',res.data)
			})
			.catch((error) => {
				console.log('errore riciesta canzone: ',error.response)
			})
	}
/*

app.get(
	'/spot/info',
	passport.authenticate('spotify', {
	  scope: ['user-read-email', 'user-read-private'],
	})
	
);


//new begin /playlist

app.get('/spot/get_playlist', (req, res) => {
	res.render('get_playlist', {title: 'Get playlist'});
})

//app.post('/spot/get_playlist', async (req, res) => {
//	var item = req.body.formUrl;
//	var slug = item.split('playlist/').pop();
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

	//new end
		
*/

console.log('in ascolto su 3000');
app.listen(3000);
