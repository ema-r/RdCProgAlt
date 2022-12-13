const bodyParser = require("body-parser");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");
const http = require('http');
const https = require('https');

dotenv = require('dotenv').config();

const passport = require("./config/passport");
const { ensureUser } = require("./middlewares/auth");
const homepageRoutes = require("./routes/homepage");
const oauthRoutes = require("./routes/oauth");
const apiRoutes = require("./routes/post");

const INSTANCE = process.env.INSTANCE || "";
const MONGO_URI = process.env.MONGO_URI || "";
const PORT = process.env.PORT || 3000;
const SPOT_TOKEN = process.env.SPOTIFY_OAUTH_TOKEN;
const SESSION_OPTIONS = {
  cookie: {
    /* cookie's lifetime: 4h */
    maxAge: 1000 * 60 * 60 * 4,
    secure: false,
  },
  resave: false,
  saveUninitialized: true,
  secret: process.env.SECRET || "",
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
};

const spot_client_auth_options = {
	url: 'https://accounts.spotify.com/api/token',
	method: 'POST'
	headers: {
		'Authorization': 'Basic ' + (new Buffer(process.env.SPOTIFY_CLIENT_ID 
			+ ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
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
const app = express();

/* set view engine */
app.set("view engine", "ejs");

/* set middlewares */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(session(SESSION_OPTIONS));

/* initialize passport */
app.use(passport.initialize());
app.use(passport.session());

/* set routes */
app.use("/api/v1/post", apiRoutes);
app.use("/homepage", homepageRoutes);
app.use("/oauth/google", oauthRoutes);

/* get root path */
app.get("/", ensureUser, (req, res) => {
  res.render("index", { title: "SongLify" });
});

/* get API docs */
app.use("/api-docs", express.static(path.join(__dirname, "/public/docs")));

app.get('/test', (req, res) => {
  res.render("test", {title: "test"});
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

	callFindSongs(new_data, api_data_input);
	console.log(new_data);
});

/* set connection with mongo */
mongoose
  .connect(MONGO_URI)
  .then((result) => {
    console.log(`${INSTANCE} -> ${result.connection.host}`);
    app.listen(PORT, () => {
      console.log(`${INSTANCE} -> ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
  });

async function callFindSongs(data, api_data) {
	return await findSongs(data, api_data);
}

function findSongs(data, api_req_data) {
  return new Promise((resolve, reject) => {
	const request = https.request(api_req_data, (result) => {
  		console.log('statusCode:', result.statusCode);
		if (result.statusCode < 200 || response.statusCode > 299) {
			throw new Error('status code: ' + response.statusCode);
		}
		else {
			result.setEncoding('utf8');
			let responseBody = '';

     			result.on('data', (d) => {
				console.log('receiving data')
				responseBody += d;
	  	   	});
			result.on('end', () => {
				console.log('end of data')
				resolve(JSON.parse(responseBody));
			});
		}
  	});
  	request.on('error', (err) => {
     		console.log('errore');
		reject(err);
  	});
	request.write(data);
	request.end();
  });
}

//Idea della funzione e' che passato come input le opzioni e il corpo dell'access token
//(per ora stabilito globalmente) possa aggiornare tutti e 3 i campi: access_token
//expires_in e refresh_token. Dovrebbe permettere di aggiornare anche token oauth
//personali e non client semplicemente passando il "body" corretto. Servira' modificare
//la funzione per questo pero', permettendo di ottenere anche refresh token mancante 
//in richieste di tipo Client Credentials
function getSpotifyToken(access_token_data, api_req_data) {
	var current_time = new Date().getTime()/1000;
	if ((current_time - access_token_data.expires_at) > 3520){
		var data = ''
		var newTokenRequest = https.request(api_req_data, (result) => {
			if (result.statusCode >= 200 || result.statusCode < 300) {
				result.setEncoding('utf8');
				let responseBody = '';
	
				result.on('data', (d) => {
					console.log('[SPOTIFY_CLIENT_TOKEN_REFRESH] receiving data');
					responseBody += d;
				});
				result.on('end', () => {
					console.log('[SPOTIFY_CLIENT_TOKEN_REFRESH] end of data');
					resolve(JSON.parse(responseBody));
				});
			} else {
				throw new Error('[SPOTIFY_CLIENT_TOKEN_REFRESH] Error: status code: ' result.statusCode)
			}
		});
		newTokenRequest.on('error', (err) => {
			reject(err);
		});
		newTokenRequest.write(data);
		newTokenRequest.end();

		access_token_data.access_token = data.access_token;
		access_token_data.expires_at   = current_time+3600;
	} else {
		console.log('no need to refresh the client token right now')
	}
};

