const db = require('../models');
const dotenv = require('dotenv').config('../.env')
const UserV2 = db.userv2;
const UserV2_spotify_data = db.userv2_spotify_data;
const UserV2_youtube_data = db.userv2_youtube_data;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

module.exports = {
	function signup = (req, res) => {	
		const user = new UserV2({
			uname: req.body.uname,
			pword: req.body.pword,
			spotify_data: new UserV2_spotify_data({
				has_permission: false
			})
			youtube_data: new UserV2_youtube_data({
				has_permission: false
			})
		})
		user.save((err, user) => {
			if (err) {
				res.status(500).send({message: err});
				return;
			}
		})
	}
	function signin = (req,res) => {
		UserV2.findOne({
			uname: req.body.uname
		}).exec((err, user) => {
			if (err) {
				res.status(500).send({message: err})M
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
					accessToken: null
					message: 'password non valida'
				});
			}
			var token = jwt.sign({ id: user.api_id }, process.env.SECRET, {
				expiresIn : 3600
			});
			res.status(200).send({
				id: user._id,
				uname = user.uname,
				accessToken: token
			})
		})
	}
}
