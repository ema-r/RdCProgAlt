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
const app = express();
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
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

app.post('/spot/callback',
  passport.authenticate('spotify', { failureRedirect: '/login', failureMessage: true }),
  function(req, res) {
    res.redirect('/~' + req.user.username);
});

app.use(passport.authenticate('session'));


app.post(
	'/form',
	passport.session(),
	async function(req, res){
		var item = (req.body.formUrl1).split('tracks/').pop();
		const req_options = {
			song_id: "585JpIId3xIGXDTL8Tg7d4",
			market: 'IT',
			access_token: "BQAapZC_qxxRwAIt7OljZkfgNz_vveniqx8O1VcZZhgZtkgbmb9bXciYDQeFzVspu1wAakg3ojBLK_lfZV3NhiJ_XiUXdsUbZcNr58WPXSCPM0ZW1rf7zpQFIuI-XjiqUTwJXLSdChh1PCGlQp01PRNg-lK0TbuSlFF1IeIDyDphp8Hrb3MQGe_kb_oxDUkhRFJfayI6L9FmA1cpI3OYNZZuo7m_9H5x1pGQrzifg2b3zqjOJQxKHziTxhHn4nSLXiySahWEsLJJfKZ3mlwd9e5qxoTnh2DO8OhZ73Cgpnvu7HlD8ePKZrak1J5ws"
		}
		const result = await getSong(req_options);
		console.log("CIAOOOOOOOOOOOOOOOOOOOOOOOOO");
		console.log(JSON.stringify(result));
	});
	
	async function getSong(req_options) {
		const rootUrl = 'https://api.spotify.com/v1/tracks/'+ req_options.song_id+'?market'+ req_options.market
			const res = await axios.get(rootUrl, {
			headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer' + req_options.access_token
				}
			})
			.then((response) => {
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

app.listen(port, () => console.log(`Listening on ${port}`));


console.log('in ascolto su 3000');
app.listen(3000);
