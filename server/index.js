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

const spot_auth_options = {
	url: 'https://accounts.spotify.com/api/token',
	headers: {
		'Authorization': 'Basic ' + (new Buffer(process.env.SPOTIFY_CLIENT_ID 
			+ ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
	},
	form: {
		grant_type: 'client_credentials'
	},
	json: true
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
	const new_data = '';
	var api_data_input = {
		hostname: 'api.spotify.com',
		port: 443,
		path: '/v1/tracks/' + slug + '?market=' + 'IT',  //TO DO: IMPLEMENTARE GEOAPI
		method: 'GET',
		headers: {
			'Accept': 'application/json',
			'Content-type': 'application/json',
			'Authorization': 'Bearer ' + SPOT_TOKEN
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
//  var req_url = 'https://api.spotify.com/v1/tracks/' + song_id + '?market=' + market; 
//  let result = await https.request({
//   method: "get",
//   url: req_url,
//   headers: {'Authorization': 'Bearer ' + SPOT_TOKEN }
//  }).catch(async function handleError(err) {
//   console.log(err);
//  })
//  return result.data;
  return new Promise((resolve, reject) => {
	const request = https.request(api_req_data, (result) => {
  		console.log('statusCode:', result.statusCode);
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
  	});
  	request.on('error', (err) => {
     		console.log('errore');
		reject(err);
  	});
	request.write(data);
	request.end();
  });
}

function refreshToken(option) {
	var request = https.request(option, (result) => {
		if (!error && )
	})
}
