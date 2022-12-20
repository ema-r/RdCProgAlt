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

const SpotifyStrategy = require('passport-spotify').Strategy;
passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});

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


passport.use(
  new SpotifyStrategy(
    {
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

app.use(express.static(path.join(__dirname, 'public')))
.use(cors())
.use(spotifyAuth({client_id, client_secret, redirect_uri}));
app.use(express.static(path.join(__dirname, '/public/css')));
app.use(express.static(__dirname + 'public'));
app.use(express.static('public'));
app.use('/static', express.static(path.join(__dirname, 'public')))
app.use('/static', express.static(path.join(__dirname, '/views/partials')));
/* set view engine */
app.set('view engine', 'ejs');
/* set middlewares */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session(SESSION_OPTIONS));
app.use(cors());
app.use(express.static('public'));
/* initialize passport */
app.use(passport.initialize());
app.use(passport.session());

/* get root path */
app.get('/', (req, res) => {
  res.render('index', { title: 'SongLify' });
});

/* get API docs */
app.use('/api-docs', express.static(path.join(__dirname, '/public/docs')));


app.get('/spot', passport.authenticate('spotify'));

app.get(
  '/spot/callback',
  passport.authenticate('spotify', { failureRedirect: '/#error' }),
  function(req, res) {
    res.redirect('/spot/info');
  }
);

app.get(
	'/spot/info',
	passport.authenticate('spotify', {
	  scope: ['user-read-email', 'user-read-private'],
	  showDialog: true
	})
);

//new begin /playlist

app.get('/spot/get_playlist', (req, res) => {
	res.render('get_playlist', {title: 'Get playlist'});
})

app.post('/spot/get_playlist', async (req, res) => {
	var item = req.body.formUrl;
	var slug = item.split('playlist/').pop();

	const req_options = {
		playlist_id: slug,
		market: 'IT', //placeholder
		access_token: spotify_access_token
	}
	const playlistInfo = await getPlaylist(req_options);
}) 

async function getPlaylist(options) {
	const rootUrl = 'https://api.spotify.com/v1/playlists/'+options.playlist_id+'?market='+options.market
	try {
		const res = await axios.get(rootUrl, {
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer'+options.access_token
			}
		});
		return res.data
	} catch(error) {
		console.log('errore fetch playlist: '+error);
		throw new Error(error.message)
	}
}
//new begin /form
app.post('/form', passport.authenticate('spotify', { failureRedirect: '/#error' }),
 async (req, res) => {
  console.log("ciao");
  var item = (req.body.song_url).split('tracks/').pop();
  const req_options = {
	  song_id: item,
	  market: 'IT',
	  access_token: token
  }
  const result = await getSong(options);
  
  console.log(JSON.Stringify(result));
});

async function getSong(options) {
	const rootUrl = 'https://api.spotify.com/v1/tracks/'+options.song_id+'?market'+options.market
	try {
		const res = await axios.get(rootUrl, {
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'Bearer '+options.access_token
			}
		})
		return res.data;
	} catch(error) {
		console.log('errore richiesta canzone: '+error);
		throw new Error(error.message);
	}
}
//new end

app.listen(port, () => console.log(`Listening on ${port}`));


console.log('in ascolto su 3000');
app.listen(3000);
