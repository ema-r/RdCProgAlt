const user = require('../models/userv2.model');
const google_data = require('../models/userv2_youtube_data.model');

const bcrypt = require('bcryptjs');

module.exports = {
	async updatePermissions(req, res) {
		google_data.updateOne({
			id: req.body.user_id},
			{$set: { has_permissions: true }},
			function(err, data) {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!data) {
				return res.status(404).send({message: 'ERRORE GRAVE: permission field non esistente'});
			}
			console.log('[GOOGLE CONTROLLER] documento permessi modificato per user: '+req.body.user_id);
		})
	},
	updateAccessToken(req, res) {
		google_data.updateOne({
			id: req.body.data_id},
			{$set: {access_token: bcrypt.hashSync(req.body.google_access_token, 8),
				expires_in: ((new Date().getTime() / 1000) + req.body.expires_in)}},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: access_token field non esistente'})
				}
				console.log('[GOOGLE CONTROLLER] access_token e expire_time salvati');
			}
		)
	},
	updateRefreshToken(req,res) {
		google_data.updateOne({
		id: req.body.data_id},
			{$set: {refresh_token: bcrypt.hashSync(req.body.google_refresh_token, 8)}},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: refresh_token field non esistente'})
				}
				console.log('refresh token salvato');
			}
		)
	},	
	updateIdToken(req,res) {
		google_data.updateOne({
		id: req.body.data_id},
			{$set: {id_token: bcrypt.hashSync(req.body.google_id_token, 8)}},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: refresh_token field non esistente'})
				}
				console.log('refresh token salvato');
			}
		)
	},
	initializeTokens(req,res) {
		updateAccessToken(req,res);
		updateRefreshToken(req,res);
		updateIdToken(req,res);
	},	
	getAccessToken(perm_id) {
		google_data.findOne({id: perm_id}).exec((err,spotData) => {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!spotData || !spotData.access_token) {
				return res.status(404).send({message: 'dati google relativi ad user non trovati'});
			}
			return {accessToken: spotData.access_token,
				expiresAt: spotData.expires_in}
		})
	},
	getRefreshToken(perm_id) {
		google_data.findOne({id: perm_id}).exec((err,spotData) => {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!spotData || !spotData.access_token) {
				return res.status(404).send({message: 'dati google relativi ad user non trovati'});
			}
			return {refreshToken: spotData.refresh_token}
		})
	},
	getIdToken(perm_id) {
		google_data.findOne({id: perm_id}).exec((err,spotData) => {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!spotData || !spotData.access_token) {
				return res.status(404).send({message: 'dati google relativi ad user non trovati'});
			}
			return {idToken: spotData.id_token}
		})
	},
}
