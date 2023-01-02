const functions = require('./../functions/exported');
const userController = require('./../controllers/sessioncontr.js');

module.exports = function(app) {
	app.use(function(req,res,next) {
		res.header(
			'Access-Control-Allow-Headers',
			'x-access-token, Origin, Content-Type, Accept'
		);
		next();
	});

	app.get('/oauth/spotify/login', [functions.tokenCheck], function(req, res) {
		session = req.session;
		var state = generateRandomString(16);
		res.cookie(stateKey, state);

		var scope = '';
		var rootUrl = 'https://accounts.spotify.com/authorize?';
		var options = {
			client_id: process.env.SPOTIFY_CLIENT_ID.toString(),
			response_type: 'code',
			redirect_uri: 'https://localhost:8443/spot/callback',
			state: state
		}
		const query = new URLSearchParams(options)
		const redirUrl = rootUrl+query.toString();
		res.redirect(redirUrl);
	});

	app.get('/oauth/spotify/callback', [functions.tokenCheck],  async function(req, res) {
	    var code = req.query.code || null;
	    var state = req.query.state || null;
	    var storedState = req.cookies ? req.cookies[stateKey] : null;
	
	    if (state === null || state !== storedState) {
	        res.redirect('/state_mismatch');
	    } else {
			res.clearCookie(stateKey);
			var authOptions = {
				code: code,
				redirect_uri: 'https://localhost:8443/spot/callback',
				grant_type: 'authorization_code'
			}
			var query = new URLSearchParams(authOptions).toString();
			data = await getSpotifyAccessToken(query);
			console.log(JSON.stringify(data));		
	
			res.redirect('/');
		}
	});

	app.post('/spotify/scrub_playlist', [functions.tokenCheck, functions.hasGivenSpotifyPerm],  async function(req, res){
//		res.render('get_playlist', {title: 'Get playlist'});
		//TODO: rimedia access token da JWT token, refresh se necessario
		var access_token = getSpotifyToken() //da vedere cosa passare, tutta req sembra piuttosto "grande"
		const req_options = {
			playlist_id: req.body.playlist_id,
			market: 'IT',
			access_token: session.cookie.spot_access_token
		}
		const result = await getPlaylist(req_options);
	});
};

async function getSong(song_id, access_token) {
	const rootUrl = 'https://api.spotify.com/v1/tracks/'+song_id+'?market=IT'
	const res = axios.get(rootUrl, {
		headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + access_token
			}
	})
	.then((res) => {
		console.log('response',res.data)
		})
	.catch((error) => {
		console.log('errore riciesta canzone: ',error.response)
	})
}

async function getSpotifyAccessToken(query) {
	var rootUrl = 'https://accounts.spotify.com/api/token';
	try {
		const res = await axios.post(rootUrl, query.toString(), { 
			headers: {
				'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID.toString()
				+ ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		},
		{ withCredentials: true });
		return res.data;
	} catch(error) {
		console.log(error, "fallimento fetch token");
		throw new Error(error.message);
	}
}

function getPlaylist(req_options) {
	const rootUrl = 'https://api.spotify.com/v1/playlists/'+ req_options.playlist_id+'?market='+ req_options.market
	const res = axios.get(rootUrl, {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + req_options.access_token
		}
	}, 
	{ withCredentials: true })
	.then((res) => {
		console.log('response',res.data)
	})
	.catch((error) => {
		console.log('errore riciesta canzone: ',error.response)
	})
}
