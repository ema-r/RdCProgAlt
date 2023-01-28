const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config('../.env')

const controller = require('../controllers/sessioncontr')
const UserV2 = require('../models/userv2.model');
const UserV2_spotify_data = require('../models/userv2_spotify_data.model');
const UserV2_youtube_data = require('../models/userv2_youtube_data.model');

module.exports = {
	tokenCheck(req, res, next) {
		let token = req.headers["x-access-token"];
	
		if (!token) {
			return res.status(403).send({message: "Token non fornito"});
		}
	
		jwt.verify(token, process.env.SECRET, (err, decoded) => {
			if (err) {
				return res.status(401).send({message: "invalid token"})
			}
			req.body.user_id = decoded.id;
			next();
		});
	},
	sessionCheck(req,res,next) {
		console.log(req.cookies.user_id);
		if(req.cookies.user_id !== undefined ){
			req.body.user_id = req.cookies.user_id;
			next();
		} else {
			return res.status(403).send({message: 'cookie non fornito'});
		}
	},
	async hasGivenSpotifyPerm(req, res, next) {
		var data = await controller.spotifyGetPermission(req,res);		
		if (data === false) {
			return res.status(403).send({message: 'accesso a spotify necessario'});
		}
		next();
	},
	async  hasGivenYoutubePerm(req, res, next) {
		var data = await controller.youtubeGetPermission(req,res);
		if (data === false) {
			return res.status(403).send({message: 'accesso a youtube necessario'});
		}
		next();
	}

}
