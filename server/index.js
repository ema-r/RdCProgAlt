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
const spotifyController = require('./controllers/spotifycontr');

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

async function initialize() {
	userModel.estimatedDocumentCount((err, count) => {
		if (!err && count === 0) {
			new userModel({
				uname: "dev",
				pword: bcrypt.hashSync('devpass', 8),
				api_sc: bcrypt.hashSync(generateRandomString(64),8),
			}).save(err => {
				if (err) { console.log('salvataggio modello dummy fallito:', err) }
			})
			console.log('db inizializzato con dummy dev model [NON INTESO PER PRODUCTION]')
		}
	});
}

/* get root path */
app.get('/', async (req, res) => {
	res.render('index', { title: 'SongLify' });
});

//test user var
var session;

require('./routes/usermng')(app);
require('./routes/userreq')(app);
require('./routes/spotreq')(app);
require('./routes/googlereq')(app);

app.get('/oauth/logout', (req, res) => {
	if ( req.session){
		req.session.destroy();
		console.log("Sloggato con successo");
		res.redirect("https://localhost:8443");
	}
	
});

/* get API docs */
app.use('/api-docs', express.static(path.join(__dirname, '/public/docs')));

console.log('in ascolto su 3000');
app.listen(3000);
