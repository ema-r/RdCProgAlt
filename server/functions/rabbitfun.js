const amqp = require('amqplib/callback_api');

module.exports = {
	//vediamo se possibile creare canale "permanente" e connettersi solo quando necessario
	async sendAPIData(datastring) {
		console.log('rabbitfuntest');
		//controlla uri sia corretto
		amqp.connect('amqp://rabbitmq:5672', function(error0, connection) {
			if (error0) {
				throw error0;
			}
			var ret = 0;
			connection.createChannel(function(error1, channel) {
				if (error1) {
					throw error1;
				}
				var queue = 'APIcalls';
				
				channel.assertQueue(queue, {
					durable: false
				});
				channel.sendToQueue(queue, Buffer.from(datastring));
				console.log(' [X] inviato %s', datastring);
				ret = 1;
			})
			setTimeout(function() {
				connection.close();
				//aggiungi errore
				return ret;
			}, 500)
		})
	}
}
