const dotenv = require('dotenv').config();
const mongoose = require('mongoose');

const path = require('path');
const APIhandler = require('./handler/APIhandler');
const amqp = require('amqplib/callback_api');

console.log('inizializzo amqp');
amqpconn();

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
			var queue = 'APIcalls';
	
			channel.assertQueue(queue, {
				durable: true,
			})
			channel.prefetch(1);
			console.log(' [*] in attesa di msg su %s', queue);
			channel.consume(queue, function(msg) {
				//inserisci qui azioni api
				var receivedDataString = msg.content.toString();
				console.log(" [x] ricevuto %s", receivedDataString);
				APIhandler.APIrequest(receivedDataString);
				setTimeout(function() {
					console.log('[x] chiamato apihandler');
					channel.ack(msg):
				}, 1 * 1000);
			}, {
				noAck: false
			});
		});

	})
}

