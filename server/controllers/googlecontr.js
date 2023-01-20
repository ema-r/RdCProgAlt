const userv2 = require('../models/userv2.model');

const bcrypt = require('bcryptjs');

module.exports = {
	async updatePermissions(req, res) {
		userv2.updateOne({
			id: req.body.user_id},
			{$set: { youtube_has_permission: true }},
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
	async getPermissions(req,res) {
		try {
			var ytData = await userv2.findOne({id: req.body.user_id});

			if (!ytData) {
				return res.status(404).send({message: 'dati youtube relativi ad user non trovati'});
			}
			return ytData.youtube_has_permission;
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
	},
	async updateAccessToken(req, res) {
		userv2.updateOne({
			id: req.body.user_id},
			//IMPLEMENTARE CRITTATURA TRAMITE CRYPTO
			{$set: {youtube_access_token: req.body.google_access_token,
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
	async updateRefreshToken(req,res) {
		userv2.updateOne({
		id: req.body.user_id},
			//IMPLEMENTARE CRITTATURA TRAMITE CRYPTO
			{$set: {youtube_refresh_token: req.body.google_refresh_token}},
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
	async updateIdToken(req,res) {
		userv2.updateOne({
		id: req.body.user_id},
			//IMPLEMENTARE CRITTATURA TRAMITE CRYPTO
			{$set: {youtube_id_token: req.body.google_id_token}},
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
	async getAccessToken(req,res) {
		try {
			var user = userv2.findOne({id: req.body.user_id})
			if (!spotData || !spotData.youtube_access_token) {
				return res.status(404).send({message: 'dati google relativi ad user non trovati'});
			}
			return {accessToken: spotData.youtube_access_token,
				expiresAt: spotData.youtube_expires_in}
		} catch(error) {
			res.status(500).send({message: error+' in funzione getAccessToken @ googlecontr.js'})
		}
	},
	async getRefreshToken(req,res) {
		try {
			var user = userv2.findOne({id: req.body.user_id});
			if (!spotData || !spotData.youtube_access_token) {
				return res.status(404).send({message: 'dati google relativi ad user non trovati'});
			}
			return {refreshToken: spotData.youtube_refresh_token}
		} catch(error) {
			res.status(500).send({message: error+' in function getRefreshToken @ googlecontr.js'})
		}
	},
	async getIdToken(req,res) {
		try {
			var user = userv2.findOne({id: req.body.user_id})
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!spotData || !spotData.youtube_access_token) {
				return res.status(404).send({message: 'dati google relativi ad user non trovati'});
			}
			return {idToken: spotData.youtube_id_token}
		} catch(error) {
			res.status(500).send({message: error+' in funzione getIdToken @ googlecontr.js'})
		}
	},
}
