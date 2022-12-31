const user = require('../models/userv2.model');
const google_data = require('../models/userv2_youtube_data.model');

const bcrypt = require('bcryptjs');

module.exports = {
	updatePermissions(req, res) {
		google_data.updateOne({
			id: req.body._id},
			{$set: { has_permissions: true }},
			function(err, data) {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!data) {
				return res.status(404).send({message: 'ERRORE GRAVE: permission field non esistente'});
			}
			res.status(200).send({message: 'documento permessi modificato'});
		})
	},
	updateAccessToken(req, res) {
		google_data.updateOne({
			id: req.body._id},
			{$set: {access_token: bcrypt.hashSync(req.body.access_token, 8),
				expires_in: ((new Date().getTime() / 1000) + req.body.expires_in)}},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: access_token field non esistente'})
				}
				res.status(200).send({message: 'access_token e expire_time salvati'});
			}
		)
	},
	updateRefreshToken(req,res) {
		google_data.updateOne({
		id: req.body._id},
			{$set: {access_token: bcrypt.hashSync(req.body.access_token, 8),
				expires_in: req.body.expires_in}},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: refresh_token field non esistente'})
				}
				res.status(200).send({message: 'refresh token salvato'});
			}
		)
	},
	initializeTokens(req,res) {
		updateAccessToken(req,res);
		updateRefreshToken(req,res);
	}
}
