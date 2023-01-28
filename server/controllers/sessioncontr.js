//const db = require('./../models');
const dotenv = require('dotenv').config('./../.env')
const UserV2 = require('../models/userv2.model');
const UserV2_spotify_data = require('../models/userv2_spotify_data.model');
const UserV2_youtube_data = require('../models/userv2_youtube_data.model');
var amqp = require('amqplib/callback_api');
const googlecontr = require('./googlecontr');
const spotifycontr = require('./spotifycontr');
const UserRabbit = require("../models/userv2.model");

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
			api_sc: bcrypt.hashSync(generateRandomString(64), 8),
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
				return;
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
			
			var token = jwt.sign({id: user._id}, process.env.SECRET, {
				expiresIn: 3600
			});
			return {
				user_name: req.body.uname,
				user_id: user._id,
				accessToken: token
			};
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
		
	},	
	async getData(req,res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id});

			if (!user) {
				return res.status(404).send({message: 'dati user non trovati'});
			}
			return user;
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
	},
	async spotifyGetPermission(req,res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id});

			if (!user) {
				return res.status(403).send({message:'dati user non trovati'});
			}
			return user.spotify_has_permission;
		} catch(error) {
			console.log(error,'fallimento db');
			throw new Error(error.message);
		}
	},	
	async youtubeGetPermission(req,res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id});

			if (!user) {
				return res.status(403).send({message:'dati user non trovati'});
			}
			return user.youtube_has_permission;
		} catch(error) {
			console.log(error,'fallimento db');
			throw new Error(error.message);
		}
	},
	async requestJWT(req,res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id})
			console.log('breakpoint 1')
			if (!user) {
				res.status(404).send({message: 'user non trovato'});
				return;
			}
			console.log(user.uname);
			console.log(req.body.api_sc)
			console.log(user.api_sc)
			var apiSecretIsValid = bcrypt.compareSync(req.body.api_sc, user.api_sc)
			console.log('breakpoint 3')
			if (!apiSecretIsValid) {
				return res.status(401).send({
					accessToken: null,
					message: 'forbidden'
				});
			}
			console.log('breakpoint 4')
			var token = jwt.sign({ id: user._id }, process.env.SECRET, {
				expiresIn: 3600
			});
			console.log('breakout 5');
			res.status(200).send({
				'accessToken': token
			})
		} catch(error) {
			console.log('[SESSION CONTROLLER:REQUEST JWT] triggered error')
			res.status(500).send({message:error});
		}
	},
	async updateGoogleTokens(req,res) {
		try {
			if (req.body.refresh_token !== null) {
				googlecontr.updateRefreshToken(req,res);
			}
			if (req.body.access_token !== null) {
				googlecontr.updateAccessToken(req,res);
			}
			if (req.body.id_token !== null) {
				googlecontr.updateIdToken(req,res);
			}
			return;
		} catch(error) {
			console.log(error, 'fallimento save token google');
			throw new Error(error.message)
		}
	},
	async updateSpotifyTokens(req,res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id})
			if (!user) {
				return res.status(404).send({message: 'user non trovato'});
			}
			req.body.data_id = user._id
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
			console.log('[GETSPOTIFYDATA] USER TROVATO: '+user);
			return user._id.toHexString();
		} catch(error) {
			console.log(error, 'fallimento get token');
			throw new Error(error.message);
		}
	},
	async getGoogleTokens(req, res) {
		try {
			var user = UserV2.findOne({id: req.body.user_id})
			if (!user || user === undefined) {
				res.status(404).send({message: 'user non trovato'});
				return;
			}
			var accessTokenData = await googlecontr.getAccessToken(req,res);
			if (isExpired(accessTokenData.expiresAt)) {
				accessTokenData = await refreshSpotifyToken(googlecontr.getRefreshToken(req,res));
			}
			return {accessToken: accessTokenData.accessToken}
		} catch(error) {
			res.status(500).send({message: error+' in function getGoogleTokens @ sessioncontr.js'});
		}
	},
	async getSpotifyTokens(req,res) {
		try {
			var user = await UserV2.findOne({id: req.body.user_id})
			if (!user || user === undefined) {
				res.status(404).send({message: 'user non trovato'});
				return;
			}
			var accessTokenData = await spotifycontr.getAccessToken(req,res);
			if (isExpired(accessTokenData.expiresAt)) {
				accessTokenData = await refreshSpotifyToken(req,res);
			}
			return {accessToken: accessTokenData.accessToken};
		} catch(error) {
			res.status(500).send({message: error});
		}
	},
	async deleteSpotifyData(req,res) {
		await spotifycontr.deleteData(req,res);
	},
	async deleteYoutubeData(req,res) {
		await googlecontr.deleteData(req,res);
	},
	async deleteUser(req,res) {
		try {
			var user = await UserV2.findOne({uname: req.body.uname});

			console.log('user da cancellare trovato: '+user);

			var pwordIsValid = bcrypt.compareSync(
				req.body.pword,
				user.pword
			)
			if (!pwordIsValid) {
				return res.status(401).send({
					message: 'password non valida'
				});
			}		

			UserV2.deleteOne({id: user._id}), function(err,data) {
				if (err) {
					return res.status(500).send({message: 'errore cancellazione account'});
				}
				console.log('account cancellato correttamente');
				return;
			}
		} catch(error) {			
			console.log(error, 'fallimento sign in');
			throw new Error(error.message);
		}

	},
	async deleteUserFrontend(req,res) {
		try {
			UserV2.deleteOne({id: req.body.user_id}), function(err,data) {
				if (err) {
					return res.status(500).send({message: 'errore cancellazione account'});
				}
				console.log('account cancellato correttamente');
				return;
			}
		} catch(error) {			
			console.log(error, 'fallimento sign in');
			throw new Error(error.message);
		}

	}
}

function isExpired(expirationDate) {
	if (expirationDate < new Date().getTime()/1000) {
		return true;
	} else {
		return false;
	}
}

async function refreshSpotifyToken(req,res) {
	var rootUrl = 'https://accounts.spotify.com/api/token';
	var reftoken = await spotifycontr.getSpotifyRefreshToken(req,res);
	try {
		var request = await axios.post(rootURL, { form: {
				grant_type: 'refresh_token',
				refresh_token: reftoken.refresh_token,
			}
		}, {
			headers: {
				'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID.toString()
				+ ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		});
		

		//RIVEDI QUESTA PARTE
		req.body.access_token = request.access_token;
		req.body.expires_in = request.expires_in;
		spotifycontr.updateSpotifyToken(req,res)
		return {accessToken: request.access_token, expiresIn: request.expires_in};
	} catch(error) {
		console.log(error, 'fallimento fetch token');
		throw new Error(error.message);
	}
}

async function refreshGoogleToken(req,res) {
	var rootUrl = 'https://oauth2.googleapis.com/token'
	var reftoken = await googlecontr.getYoutubeRefreshToken(req,res);
	try {
		var request = await axios.post(rootUrl, { form: {
			client_id: process.env.GOOGLE_CLIENT_ID,
			client_secret: process.env.GOOGLE_CLIENT_SECRET,
			grant_type: 'refresh_token',
			refresh_token: reftoken.refreshToken,
		}, headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		});
		req.body.google_access_token = request.access_token;
		req.body.google_expires_in = request.expires_in;
		return {accessToken: request.access_token, expiresIn: request.expires_in};
	} catch(error) {
		res.status(500).send({message: 'error getting refresh token google'});
	}
}
