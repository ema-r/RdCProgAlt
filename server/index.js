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
const INSTANCE = process.env.INSTANCE || '';
const MONGO_URI = process.env.MONGO_URI || '';
const PORT = process.env.PORT || 3001;
const SPOT_TOKEN = process.env.SPOTIFY_OAUTH_TOKEN;

mongoose.connect(MONGO_URI+'/'+process.env.MONGO_DB_NAME+'?authSource=admin', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
//	useFindAndModify: false,
//	useCreateIndex: true
});

mongoose.connection
	.on("open", () => console.log("MONGOOSE UP AND RUNNING"))
	.on("close", () => console.log("MONGOOSE CONNECTION CLOSED"))
	.on("error", (error) => {
		console.log(error);
		process.exit();
});

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
.use(cors({
	origin: 'https://localhost:8443',
	credentials: true
}))
app.use(express.static(path.join(__dirname, '/public/css')));
app.use(express.static(__dirname + 'public'));
app.use(express.static('public'));

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
//	genid: (req) => {
//		return uuidv4()
//	},
	secret: 'keyboard cat',
	store: MongoStore.create({
		mongoUrl: MONGO_URI,
		dbName: process.env.MONGO_DB_NAME,
		collectionName: "sessions",
		stringify: false,
		autoRemove: "interval",
		autoRemoveInterval: 1
	}),
  	resave: true,
  	saveUninitialized: false,
  	cookie: { secure: true , maxAge: oneDay}
}));

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/static', express.static(path.join(__dirname, '/views/partials')));
app.set('view engine', 'ejs');
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.static('public'));

/* get root path */
app.get('/', (req, res) => {
  console.log('REQ.SESSiON', req.session)
  console.log('SESSION', session)
  res.render('index', { title: 'SongLify' });
});

//test user var
const username = 'dev'
const password = 'devpass'

var session;

app.get('/oauth', (req,res) => {
	session = req.session;
	if (session.userid) {
		res.redirect("https://localhost:8443");
	} else {
		res.render(href="partials/login_form");
	}
});

app.post('/oauth/login', async (req, res) => {
	if(req.body.username == username && req.body.password == password) {
		session = req.session;
		session.cookie.userid=req.body.username;
		await session.save((err) => {
			if (!err) {
			console.log('saving session');
			} else {
			console.log('errore salvataggio user id :', err)
			}
		});
		console.log('=======OAUTH/LOGIN ')
		console.log(req.session)
		res.render(href="partials/logged_in");
	}
	else {
		res.render(href="partials/not_logged_in");
	}

});

app.post('/oauth/try_logged', (req, res) => {
	session = req.session;
	console.log("Loggato con successo")
	res.redirect("https://localhost:8443");
});

app.get('/oauth/logout', (req, res) => {
	req.session.destroy();
	console.log("Sloggato con successo");
	res.redirect("https://localhost:8443");
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


//spotify
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
	session = req.session;
	if (session === null || session.userid) {
		res.redirect('state_mismatch');
	} else {
		res.clearCookie(stateKey);
		var authOptions = {
			code: req.query.code,
			redirect_uri: 'https://localhost:8443/spot/callback',
			grant_type: 'authorization_code'
		}
		var query = new URLSearchParams(authOptions).toString();
		data = await getSpotifyAccessToken(query);
		console.log(JSON.stringify(data));		

	//	session = req.session;
		session.cookie.spot_access_token=data.access_token;
		await session.save((err) => {
			if (!err) {
			console.log('saving session');
			} else {
			console.log('errore salvataggio access_token:', err)
			}
		});

		console.log('=======SPOT/CALLBACK ')
		console.log(req.session)

		res.redirect('/');
	}
});

async function getSpotifyAccessToken(query) {
	var rootUrl = 'https://accounts.spotify.com/api/token';
	try {
		const res = await axios.post(rootUrl, query.toString(), { headers: {
			'Authorization': 'Bearer ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID.toString()
								+ ':' + process.env.SPOTIFY_CLIENT_SECRET.toString()).toString('base64')),
			'Content-Type': 'application/x-www-form-urlencoded'
			},
		}, { withCredentials: true });
		return res.data;
	} catch(error) {
		console.log(error, "fallimento fetch token");
		throw new Error(error.message);
	}
}

app.post('/form', async function(req, res){
		var item = (req.body.formUrl1).split('track/').pop();
		console.log(session)
		const req_options = {
			song_id: "5C7rx6gH1kKZqDUxEI6n4l",
			market: 'IT',
			access_token: session.cookie.spot_access_token
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
			}, { withCredentials: true })
			.then((res) => {
				console.log('response',res.data)
			})
			.catch((error) => {
				console.log('errore riciesta canzone: ',error.response)
			})
	}


//app.get(
//	'/spot/info',
//	passport.authenticate('spotify', {
//	  scope: ['user-read-email', 'user-read-private'],
//	})
//	
//);


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

console.log('in ascolto su 3000');
app.listen(3000);
