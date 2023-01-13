//const db = require('./../models');
const dotenv = require('dotenv').config('./../.env')
const UserV2 = require('../models/userv2.model');
const UserV2_spotify_data = require('../models/userv2_spotify_data.model');
const UserV2_youtube_data = require('../models/userv2_youtube_data.model');

const googlecontr = require('./googlecontr');
const spotifycontr = require('./spotifycontr');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

var generateRandomString = function(length) {  //va spostata in functions, per ora e' qui
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

module.exports = {
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
				//api_id: user.api_id,
				//api_sc: user.api_sc
				})
			}
		})
	},
//	signIn(req,res) {
//		var user;
//		UserV2.findOne({
//			uname: req.body.uname
//		}).exec((err, user) => {
//			if (err) {
//				console.log('triggered error')
//				res.status(500).send({message: err});
//				return;
//			}
//			if (!user) {
//				res.status(404).send({message: 'user non trovato'});
//				return;
//			}
//			var pwordIsValid = bcrypt.compareSync(
//				req.body.pword,
//				user.pword
//			)
//			if (!pwordIsValid) {
//				return res.status(401).send({
//					accessToken: null,
//					message: 'client secret non valido'
//				});
//			}
//			var token = jwt.sign({ id: user._id }, process.env.SECRET, {
//				expiresIn : 3600
//			});
////			return {
////				'user_id': user._id,
////				'uname': user.uname,
////				'accessToken': token
////			}
//			return 'test';
//		})
//	},
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
					accessToken: null,
					message: 'client secret non valido'
				});
			}
			var token = jwt.sign({id: user._id}, process.env.SECRET, {
				expiresIn: 3600
			});
			return {accessToken: token, user_id: user._id};
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
		
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
			if (req.body.access_token === null) {
				return googlecontr.updateRefreshToken(req,res);
			}
			if (req.body.refresh_token === null) {
				return googlecontr.updateAccessToken(req,res);
			}
			return googlecontr.initializeTokens(req, res);
		})
	},
	updateSpotifyTokens(req,res) {
		UserV2.findOne({id: req.body.user_id}).exec((err,user) => {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!user) {
				return res.status(404).send({message: 'user non trovato'});
			}
			req.body.data_id = user.spotify_data._id
			if (req.body.access_token === null) {
				return spotifycontr.updateRefreshToken(req,res);
			}
			if (req.body.refresh_token === null) {
				return spotifycontr.updateAccessToken(req,res);
			}
			return spotifycontr.initializeTokens(req, res);
		})
	},
	getGoogleTokens(req, res) {
		console.log('funzione da completare');
		return res.status(500);
	},
	getSpotifyTokens(req, res) {
		UserV2.findOne({id: user_id}).exec
		return res.status(500); //placeholder
	}
}
