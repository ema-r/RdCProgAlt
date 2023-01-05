const functions = require('./../functions/jwtfun');
const controller = require('./../controllers/sessioncontr');

module.exports = function(app) {
	app.use(function(req, res, next) {
    	res.header(
      		"Access-Control-Allow-Headers",
      		"x-access-token, Origin, Content-Type, Accept"
    	);
		next();
	});
	
	app.get('/api/test', [functions.tokenCheck], (req, res) => {
		console.log('riuscito ad entrare in area riservata ad utenti');
	})
}
