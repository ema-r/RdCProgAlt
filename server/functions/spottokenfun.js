const spotData = require('../models/userv2_spotify_data.model');
const spotContr = require('../controllers/spotifycontr');
const dotenv = require('dotenv').config('./../.env')

module.exports = {
	getSavedSpotifyToken(req,res) {
		//aggiungere check jwt token
		//o forse conviene in route?
		//controlla se scaduto, se non, ritorna access_token salvato
		const id = req.body.perm_id
		if (id) {
			return res.status(500).send({message: 'malformed request in SPOTTOKENGET'})
		}
		var data = spotTokenCheckExpired(id)
		if (data.expired === false) {
			res.status(200).send({
				access_token: data.access_token;
			})
			next();
		}
		else {
			const newAccessTokenData = await RefreshToken(id);
			const updateTokenReq = {
				body: {
					_id: id,
					access_token: newAccessTokenData.access_token,
					expires_in: newAccessTokenData.expires_in
				}
			}
			var updateRes = spotContr.updateAccessToken(req, updateRes);
			if (updateRes === 200 || !error) {
				res.status(200).send({
					access_token: newAccessTokenData.access_token
				})
				next();
			}
		}
		//da completare.
	}
}	

function spotTokenCheckExpired(perm_id) {
	if (!perm_id) {
		return res.status(500).send({message: 'malformed request in fun SPOTTOKENCHECKEXPIRED'})
	}
	const token_data = spotContr.getAccessToken(perm_id);
	var return_data;
	if (token_data.expires_at < new Date().getTime() / 1000) {
		return return_data = {expired: true};
	}
	return return_data = {
		expired: false,
		access_token: token_data.access_token
	}
}

async function refreshToken(id) {  //possibile integrare con funzione get token 
	const rootUrl = 'https://accounts.spotify.com/api/token';
	const authOptions = {
		grant_type: 'refresh_token',
		refresh_token: spotContr.getRefreshToken(id)
	};
	var query = new URLSearchParams(authOptions).toString
	
	try {
		const res = await axios.post(rootUrl, query.toString(), headers: {
				'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID
					+ ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
				'Content-Type': 'application/x-www-form-urlencoded'
	
		});
		return res;
	} catch(error) {
		console.log(error, "fallimento refresh token in refreshToken, in functions/spottokenfun");
		throw new Error(error.message);
	}
}
