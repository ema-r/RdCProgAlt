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
	app.get('/oauth',[functions.reverseSessionCheck], (req,res) => {
		if (functions.tokenCheck === 200) {
			res.redirect("https://localhost:8443");
		} else {
			res.render(href="partials/login_form");
		}
	});

	//front end iscrizione
	app.get('/oauth/signup', [functions.reverseSessionCheck],(req,res) => {
		//implem check duplicati. Gia presenti nelle funzioni
		//vanno solamente aggiunti

		res.render(href="partials/signup_form")
	});	

	//Riceve richieste creazione account FRONTEND. Necessita un campo uname
	//(username) e un campo pword (password) per crearlo correttamente,
	//forniti da form
	//necessario per accedere a /oauth/login, che fornisce token JWT
	//per utilizzo applicazione. se andato senza problemi redirige a 
	//home
	app.post('/oauth/signup', [functions.reverseSessionCheck], async (req, res) => {
		await controller.signUp(req,res);
		res.redirect('/oauth');
	});
	
	//Riceve richieste creazione account. Necessita un campo uname
	//(username) e un campo pword (password) per crearlo correttamente
	//necessario per accedere a /oauth/login, che fornisce token JWT
	//per utilizzo applicazione. se andato senza problemi restituisce
	//status 200 e un JSON contenente messaggio di reg riuscita
	//e nome utente.
	app.post('/oauth/signup/api', async (req, res) => {
		var code = await controller.signUp(req,res);
		res.status(200).send({message: 'iscrizione riuscita'});
	})

	//Necessita un campo uname e pword validi e gia presenti nel DB
	//Se non incontra problemi, manda utente a pagina account, 
	//aggiunge cookie user id
	app.post('/oauth/login', [functions.reverseSessionCheck], async (req, res) => {
		session = req.session
		var data = await controller.signIn(req,res);
		res.cookie('user_id',data.user_id);	
		res.redirect('/user/data');
	})

	app.get('/user/data', [functions.sessionCheck], async (req,res) => {
		var data = await controller.getData(req,res);
		res.render(href='partials/user_data', {Dati: data});
	})

	app.get('/user/data/api', [functions.tokenCheck], async (req,res) =>  {
		var data = await controller.getData(req,res)
		res.status(200).send(data);
	})

	//Necessita campo uname e pword validi e gia presenti nel DB
	//se non incontra problemi, restituisce status 200 e 
	//accessToken, token JWT necessario per API
	app.post('/oauth/login/api', async (req,res) => {
		var data = await controller.signIn(req,res);
		res.send({accessToken: data.accessToken});
	})

	//Necessita campo uname e pword validi, gia presenti nel DB
	//se non incontra problemi redirige a home, per FRONTEND
	app.post('/oauth/delete', [functions.sessionCheck] ,async (req,res) => {
		var data = await controller.deleteUserFrontend(req,res);
		res.redirect('/oauth/logout');
	});
	
	//Necessita campo uname e pword validi, gia presenti nel DB
	//se non incontra problemi restituisce 200	
	app.delete('/oauth/delete/api', async (req,res) => {
		var data = await controller.deleteUser(req,res);
		res.status(200).send({message: 'account eliminato correttamente, arrivederci'});
	});

;}
