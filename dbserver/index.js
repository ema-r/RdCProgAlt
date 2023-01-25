require('dotenv').config()
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const path = require('path');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const amqp = require('amqplib/callback_api');

var userModel = require('./models/userv2.model');

mongoose.connect('mongodb://mongo:27017/', {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		console.log('MONGOOSE, CONNESSIONE CON DBNODE STABILITA');
		initialize();
	})
	.catch(err => {
		console.error('MONGOOSE, ERRORE CONNESSIONE CON DBNODE', err);
		process.exit();
	});

console.log('inizializzo amqp');
amqpconn();

async function initialize() {
	userModel.estimatedDocumentCount((err, count) => {
		if (!err && count === 0) {
			new userModel({
				uname: 'dev',
				pword: bcrypt.hashSync('devpass', 8)			
			}).save(err => {
				if (err) { console.log('salvataggio modello dummy fallit: ', err)}
			})
			console.log('db inizializzato con dummy dev model [NON INTESO PER PRODUCTION]');
		}
	})
}

async function amqpconn() {
	await new Promise(r => setTimeout(r, 60000));
	console.log('dbserver, tempo di attesa terminato, apro connessione a rabbitmq');
	amqp.connect('amqp://rabbitmq:5672', function(error0, connection) {
		console.log('amqptest')
		if (error0) {
			console.log('errore amqp')
			throw error0;
		}	
		connection.createChannel(function(error1, channel) {
			if (error1) {
				throw error1;
			}
			var queue = 'hello';
	
			channel.assertQueue(queue, {
				durable: false,
			})
			console.log(' [*] in attesa di msg su %s', queue);
			channel.consume(queue, function(msg) {
				console.log(" [x] ricevuto %s", msg.content.toString());
			}, {
				noAck: true
			});
		});

	})
}

