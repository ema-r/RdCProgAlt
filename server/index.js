require('dotenv').config()
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const express = require('express');
const sessions = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const { dirname } = require('path');
const mailer = require('nodemailer');
const {URL} = require('url');
const axios = require('axios');
const amqp = require('amqplib/callback_api');
const GoogleContr = require('./controllers/googlecontr');

const INSTANCE = process.env.INSTANCE || '';
const MONGO_URI = process.env.MONGO_URI || '';
const PORT = process.env.PORT || 3001;
const SPOT_TOKEN = process.env.SPOTIFY_OAUTH_TOKEN;

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

/* get root path */
app.get('/', async (req, res) => {
	res.render('index', { title: 'SongLify' });
});

//test user var
//var session;

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

app.get('/amqptest', (req,res) =>  {
	amqp.connect('amqp://rabbitmq', function(error0, connection) {
		if (error0) {
			throw error0;
		}
		connection.createChannel(function(error1, channel) {
			if (error1) {
				throw error1;
			}
			var queue = 'hello';
			var msg = 'hello world';

			channel.assertQueue(queue, {
				durable: false
			});
			channel.sendToQueue(queue, Buffer.from(msg));
			console.log(" [X] sent %s", msg);
		})

		setTimeout(function() {
			connection.close();
			res.redirect('/');
		}, 500);
	});
});

/* get API docs */
app.use('/api-docs', express.static(path.join(__dirname, '/public/docs')));

console.log('in ascolto su 3000');
app.listen(3000);
