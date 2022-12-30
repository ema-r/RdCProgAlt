const functions = require('./../functions/exported');
const controller = require('./../controllers/sessioncontr');

module.exports = function(app) {
	app.use(function(req, res, next) {
    	res.header(
      		"Access-Control-Allow-Headers",
      		"x-access-token, Origin, Content-Type, Accept"
    	);
		next();
	});
	
	app.get('/oauth', (req,res) => {
		console.log(functions)
		if (functions.jwtfun.tokenCheck === 200) {
			res.redirect("https://localhost:8443");
		} else {
			res.render(href="partials/login_form");
		}
	});
	app.get('/oauth/signup', (req,res) => {
		res.render(href="partials/signup_form")
	})
	
	app.post('/oauth/signup', async (req, res) => {
		controller.signUp(req,res);
	});
	
	app.post('/oauth/login', async (req, res) => {
		controller.signIn(req,res);
		res.redirect('https://localhost:8443/api/test')
	})
;}
