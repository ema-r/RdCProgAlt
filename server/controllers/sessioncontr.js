//const db = require('./../models');
const dotenv = require('dotenv').config('./../.env')
const UserV2 = require('../models/userv2.model');
const UserV2_spotify_data = require('../models/userv2_spotify_data.model');
const UserV2_youtube_data = require('../models/userv2_youtube_data.model');

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = {
	signUp(req, res) {	
		const userv2 = new UserV2({
			uname: req.body.uname,
			pword: bcrypt.hashSync(req.body.pword, 8),
			spotify_data: new UserV2_spotify_data({
				has_permission: false
			}),
			youtube_data: new UserV2_youtube_data({
				has_permission: false
			})
		})
		userv2.save((err, user) => {
			if (err) {
				res.status(500).send({message: err, aaaaaaaaa: 'aaaaaaaaaaaaaa'});
				return;
			} else {
				res.status(200).send({
				message: 'registrazione riuscita',
				uname: user.uname
				})
			}
		})
	},
	signIn(req,res) {
		UserV2.find({}).exec((err, user) => {
			console.log(user);
		})
		UserV2.findOne({
			uname: req.body.uname
		}).exec((err, user) => {
			if (err) {
				res.status(500).send({message: err});
				return;
			}
			if (!user) {
				return res.status(404).send({message: 'user non trovato'});
			}
			var pwordIsValid = bcrypt.compareSync(
				req.body.pword,
				user.pword
			)
			if (!pwordIsValid) {
				return res.status(401).send({
					accessToken: null,
					message: 'password non valida'
				});
			}
			var token = jwt.sign({ id: user.api_id }, process.env.SECRET, {
				expiresIn : 3600
			});
			res.status(200).send({
				id: user._id,
				uname: user.uname,
				accessToken: token
			})
		})
	}
}
