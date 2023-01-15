//const db = require('./../models');
const dotenv = require('dotenv').config('./../.env')
const UserV2 = require('../models/userv2.model');
const UserV2_spotify_data = require('../models/userv2_spotify_data.model');
const UserV2_youtube_data = require('../models/userv2_youtube_data.model');

const googlecontr = require('./googlecontr');
const spotifycontr = require('./spotifycontr');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios')

var generateRandomString = function(length) {  //va spostata in functions, per ora e' qui
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

module.exports = {
	//Funzione signup FRONTEND
	signUp(req, res) {	
		var userv2 = new UserV2({
			uname: req.body.uname,
			pword: bcrypt.hashSync(req.body.pword, 8),
			api_id: generateRandomString(16), //da gestire errore collisione in caso due account con stesso api_id
			api_sc: bcrypt.hashSync(generateRandomString(32), 8),
			spotify_data: new UserV2_spotify_data({
				has_permission: false
			}),
			youtube_data: new UserV2_youtube_data({
				has_permission: false
			})
		})
		userv2.save((err, user) => {
			if (err) {
				console.log('triggered errore iscrizione, ' + 'errore: '+err)
				res.status(500).send({message: err, aaaaaaaaa: 'aaaaaaaaaaaaaa'});
				return;
			} else {
				res.status(200).send({
				message: 'registrazione riuscita',
				uname: user.uname
				//api_sc: user.api_sc
				})
			}
		})
	},
	async signIn(req,res) {
		try {
			var user = await UserV2.findOne({uname: req.body.uname});
			if (!user) {
				res.status(404).send({message: 'user non trovato'});
			}
			var pwordIsValid = bcrypt.compareSync(
				req.body.pword,
				user.pword
			)
			if (!pwordIsValid) {
				return res.status(401).send({
					message: 'password non valida'
				});
			}
			return {
				user_name: req.body.uname,
				accessToken: token,
				user_id: user._id,
				apiSecret: user.api_sc
			};
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
	},
	requestJWT(req,res) {
		UserV2.findOne({
			id: req.body.id
		}).exec((err, user) => {
			if (err) {
				console.log('triggered error');
				res.status(500).send({message: err});
				return;
			}
			if (!user) {
				res.status(404).send({message: 'user non trovato'});
				return;
			}
			var apiSecretIsValid = bcrypt.compareSync(
				req.body.api_sc,
				user.api_sc
			)
			if (!apiSecretIsValid) {
				return res.status(401).send({
					accessToken: null,
					message: 'forbidden'
				});
			}
			var token = jwt.sign({ id: user._id }, process.env.SECRET, {
				expiresIn: 3600
			});
			res.status(200).send({
				'accessToken': token
			})
		})
	},
	updateGoogleTokens(req,res) {
		UserV2.findOne({id: req.body.user_id}).exec((err,user) => {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!user) {
				return res.status(404).send({message: 'user non trovato'});
			}
			req.body.data_id = user.google_data._id


			//attualmente non prendiamo refresh token da google
			//probabilmente caso di modificare
//			if (req.body.access_token === null) {
//				return googlecontr.updateRefreshToken(req,res);
//			}
//			if (req.body.refresh_token === null) {
				googlecontr.updateAccessToken(req,res);
				googlecontr.updateIdToken(req,res);
				return;
//			}
//			return googlecontr.initializeTokens(req, res);
		})
	},
	async updateSpotifyTokens(req,res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id})
			if (!user) {
				return res.status(404).send({message: 'user non trovato'});
			}
			req.body.data_id = user.spotify_data._id
			if (req.body.access_token === null) {
				await spotifycontr.updateRefreshToken(req,res);
				return;
			}
			if (req.body.refresh_token === null) {
				await spotifycontr.updateAccessToken(req,res);
				return;
			}	
			await spotifycontr.updateAccessToken(req,res);
			await spotifycontr.updateRefreshToken(req,res);
			return;
		} catch(error) {
			console.log(error, 'fallimento save token');
			throw new Error(error.message)

		}
	},
	async getSpotifyData (req, res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id})
			if (!user) {
				return res.status(404).send({message: 'user non trovato'});
			}
			return user.spotify_data._id;
		} catch(error) {
			console.log(error, 'fallimento get token');
			throw new Error(error.message);
		}
	},
	getGoogleTokens(req, res) {
		UserV2.findOne({id: req.body.user_id}).exec((err,user) => {
			if (err) {
				res.status(500).send({message:err});
				return;
			} if (!user) {
				res.status(404).send({message: 'user non trovato'});
				return;
			}
			req.body.data_id = user.spotify_data._id
			var accessTokenData = googlecontr.getAccessToken(req,res);
			if (isExpired(accessTokenData.expiresAt)) {
				accessTokenData = refreshSpotifyToken(googlecontr.getRefreshToken(req,res));
			}
			return {accessToken: accessTokenData.accessToken}
		})
	},
	async getSpotifyTokens(req,res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id})
			if (!user) {
				res.status(404).send({message: 'user non trovato'});
				return;
			}
			req.body.data_id = user.spotify_data._id
			var accessTokenData = spotifycontr.getAccessToken(req,res);
			if (isExpired(accessTokenData.expiresAt)) {
				accessTokenData = await refreshSpotifyToken(spotifycontr.getRefreshToken(req,res));
			}
			return {accessToken: accessTokenData.accessToken};
		} catch(error) {
			res.status(500).send({message: error});
		}
	}
}

function isExpired(expirationDate) {
	if (accessTokenData.expiresAt < new Date().getTime()/1000) {
		return true;
	} else {
		return false;
	}
}

function async refreshSpotifyToken(req,res) {
	var rootUrl = 'https://accounts.spotify.com/api/token';
	try {
		var request = await axios.post(rootURL, { form: {
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
			}
		}, {
			headers: {
				'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID.toString()
				+ ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		});
		
		req.body.accessToken = request.access_token;
		req.body.expires_in = request.expires_in;
		updateSpotifyToken(req,res)
		return request.access_token;
	} catch {
		console.log(error, 'fallimento fetch token');
		throw new Error(error.message);
	}
}

function async refreshGoogleToken(req,res) {
	return
}
