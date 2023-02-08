const userv2 = require('../models/userv2.model');

const bcrypt = require('bcryptjs');

module.exports = {
	async updatePermissions(req, res) {
		userv2.updateOne({
			_id: req.body.user_id},
			{$set: { spotify_has_permission: true }},
			function(err, data) {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!data) {
				return res.status(404).send({message: 'ERRORE GRAVE: permission field non esistente'});
			}
			console.log('[SPOTIFY CONTROLLER] permessi aggiornati correttamente per user: ' + data)
		})
	},
	async getPermissions(req,res) {
		try {
			var spotData = await userv2.findOne({_id: req.body.user_id});

			if (!spotData) {
				return res.status(404).send({message: 'dati spotify relativi ad user non trovati'});
			}
			return spotData.spotify_has_permission;
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
	},
	async deleteData(req,res) {
		userv2.updateOne({
			_id: req.body.user_id},
			{$set: {spotify_has_permission: false}, $unset: {spotify_access_token: '', spotify_expires_in: '', spotify_refresh_token: ''}},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: access_token field non esistente'})
				}
				console.log('[SPOTIFY CONTROLLER] dati impostati per user: ' + req.body.user_id);

			})
	
	},
	async updateAccessToken(req, res) {
		console.log('[ACCESS TOKEN UPDATE] ACCESS TOKEN: '+req.body.access_token);
		userv2.updateOne({
			_id: req.body.user_id},
			//IMPLEMENTARE CRITTATURA TRAMITE CRYPTO
			{$set: {spotify_access_token: req.body.access_token,
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
		_id: req.body.user_id},
			//IMPLEMENTARE CRITTATURA TRAMITE CRYPTO
			{$set: {spotify_refresh_token: req.body.refresh_token}},
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
			var spotData = await userv2.findOne({_id: req.body.user_id})		

			if (!spotData || !spotData.spotify_access_token) {
				return res.status(404).send({message: 'dati spotify relativi ad user non trovati'});
			}
			console.log('sono in getAccessToken @ spotifycontr.js, prendendo access token '+spotData.spotify_access_token+' per utente '+spotData.uname);
			return {
				accessToken: spotData.spotify_access_token,
				expiresAt: spotData.spotify_expires_in,
			}
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
	},
	async getRefreshToken(req,res) {
		userv2.findOne({_id: req.body.user_id}).exec((err,spotData) => {
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
