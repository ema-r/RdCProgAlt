const userv2 = require('../models/userv2.model');

const bcrypt = require('bcryptjs');

module.exports = {
	async updatePermissions(req, res) {

		userv2.updateOne({
			id: req.body.user_id},
			{$set: { spotify_has_permissions: true }},
			function(err, data) {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!data) {
				return res.status(404).send({message: 'ERRORE GRAVE: permission field non esistente'});
			}
			console.log('[SPOTIFY CONTROLLER] permessi aggiornati correttamente per user: ' + req.body.user_id)
		})
	},
	async getPermissions(req,res) {
		try {
			var spotData = await userv2.findOne({id: req.body.user_id});

			if (!spotData) {
				return res.status(404).send({message: 'dati spotify relativi ad user non trovati'});
			}
			return spotData.spotify_has_permissions;
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
	},
	async updateAccessToken(req, res) {
		console.log('[ACCESS TOKEN UPDATE] ACCESS TOKEN: '+req.body.access_token);
		userv2.updateOne({
			id: req.body.user_id},
			{$set: {spotify_access_token: bcrypt.hashSync(req.body.access_token, 8),
				spotify_expires_in: ((new Date().getTime() / 1000) + req.body.expires_in)}},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: access_token field non esistente'})
				}
				console.log('[SPOTIFY CONTROLLER] access token salvato per user: ' + req.body.user_id);

			}
		)
	},
	async updateRefreshToken(req,res) {
		console.log('sono in updateRefreshToken')
		userv2.updateOne({
		id: req.body.user_id},
			{$set: {spotify_refresh_token: bcrypt.hashSync(req.body.refresh_token, 8)}},
			function(err, data) {
				console.log('sono in funzione interna updateRefreshToken')
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: refresh_token field non esistente'})
				}
				console.log('[SPOTIFY CONTROLLER] refresh token salvato per user: '+ req.body.user_id);
			}
		)
	},
	async initializeTokens(req,res) {
		await updateAccessToken(req, res);
		await updateRefreshToken(req,res);
	},
	async getAccessToken(req,res) {
		try {
			var spotData = await userv2.findOne({id: req.body.user_id})		

			if (!spotData || !spotData.spotify_access_token) {
				return res.status(404).send({message: 'dati spotify relativi ad user non trovati'});
			}
			return {
				access_token: spotData.spotify_access_token,
				expires_at: spotData.spotify_expires_in,
			}
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
	},
	async getRefreshToken(req,res) {
		userv2.findOne({id: req.body.user_id}).exec((err,spotData) => {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!spotData || !spotData.spotify_access_token) {
				return res.status(404).send({message: 'dati spotify relativi ad user non trovati'});
			}
			return {refresh_token: spotData.spotify_refresh_token}
		})
	}
}
