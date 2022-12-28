const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config('../.env')

//const db = require('/models')
const UserV2 = require('../models/userv2.model');
const UserV2_spotify_data = require('../models/userv2_spotify_data.model');
const UserV2_youtube_data = require('../models/userv2_youtube_data.model');

module.exports = {
	tokenCheck(req, res, next) {
		let token = req.headers["x-access-token"];
	
		if (!token) {
			return res.status(403).send({message: "Token non fornito"});
		}
	
		jwt.verif(token, config.secret, (err, decoded) => {
			if (err) {
				return res.status(401).send({message: "invalid token"})
			}
			req.user_id = decoded.id;
			next();
		});
	},
	hasGivenSpotifyPerm(req, res, next) {
		User.findById(req.user_id).exec((err, user) => {
			if (err) {
				res.status(500).send({message: err});
				return;
			}
			UserV2_spotify_data.Find({_id: { $in: user.spotify_data }},
				(err, roles) => {
					if (err) {
						res.status(500).send({message: err});
						return;
					}
					if (spotify_data.has_permission === true) {
						next();
						return;
					}
				res.status(403).send({message: 'permessi spotify richiesti'});
				return;
				}
			)
		})
	},
	hasGivenYoutubePerm(req, res, next) {
		User.findById(req.user_id).exec((err, user) => {
			if (err) {
				res.status(500).send({message: err});
				return;
			}
			UserV2_youtube_data.Find({_id: { $in: user.youtube_data }},
				(err, roles) => {
					if (err) {
						res.status(500).send({message: err});
						return;
					}
					if (youtube_data.has_permission === true) {
						next();
						return;
					}
				res.status(403).send({message: 'permessi spotify richiesti'});
				return;
				}
			)
		})
	}

}
