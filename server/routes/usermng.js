const functions = require('./../functions/jwtfun');
const controller = require('./../controllers/sessioncontr');
const util = require('node:util');

var session

module.exports = function(app) {
	app.use(function(req, res, next) {
    	res.header(
      		"Access-Control-Allow-Headers",
      		"x-access-token, Origin, Content-Type, Accept"
    	);
		next();
	});
	//front end "home" funzioni login
	app.get('/oauth', (req,res) => {
		console.log(functions)
		if (functions.jwtfun.tokenCheck === 200) {
			res.redirect("https://localhost:8443");
		} else {
			res.render(href="partials/login_form");
		}
	});

	//front end iscrizione
	app.get('/oauth/signup', (req,res) => {
		//implem check duplicati. Gia presenti nelle funzioni
		//vanno solamente aggiunti
		res.render(href="partials/signup_form")
	});	

	//Riceve richieste creazione account. Necessita un campo uname
	//(username) e un campo pword (password) per crearlo correttamente
	//necessario per accedere a /oauth/login, che fornisce token JWT
	//per utilizzo applicazione. se andato senza problemi restituisce
	//status 200 e un JSON contenente messaggio di reg riuscita
	//e nome utente.
	app.post('/oauth/signup', async (req, res) => {
		var data = await controller.signUp(req,res);
		res.redirect('/oauth/login');
	});
	
	app.post('/oauth/signup/api', async (req, res) => {
		var data = await controller.signUp(req,res);
		res.status(200).send({message: 'iscrizione riuscita'});
	})

	//Necessita un campo uname e pword validi e gia presenti nel DB
	//Se non incontra problemi, restituisce una risposta con status
	//200 e contenente user id, user uname e l'accesstoken richiesto
	//rispettivamente in campi user_id, uname e accessToken
	app.post('/oauth/login', async (req, res) => {
		session = req.session
		var data = await controller.signIn(req,res);
		console.log(data)
		//CREAZIONE COOKIE PIU SOLIDA NECESSARIA
		console.log(data.user_id.toHexString());
		res.cookie('user_id',data.user_id.toHexString());	
		res.render(href='partials/logged_in', {Dati: data});

//		var response = JSON.stringify(res);
//		var resp = await JSON.parse(response);
//		console.log('oauth login route res: '+response);
//		res.redirect('https://localhost:8443/api/test')
	})
	//login bypassando frontend, riceve json dati
	app.post('/oauth/login/api', async (req,res) => {
		var data = await controller.signIn(req,res);
		res.send({accessToken: data.accessToken});
	})


	
	app.delete('/oauth/delete', [functions.sessionCheck] ,async (req,res) => {
		var data = await controller.deleteUser(req,res);
		res.redirect('/');
	});

	app.delete('/oauth/delete/api', [functions.tokenCheck], async (req,res) => {
		var data = await controller.deleteUser(req,res);
		res.status(200).send({message: 'account eliminato correttamente, arrivederci'});
	});

//	app.get('/oauth/postlogin', (req,res) => {
//		res.render(href='partials/logged_in')
//	})
;}
