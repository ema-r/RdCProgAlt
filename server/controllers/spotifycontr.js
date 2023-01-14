const user = require('../models/userv2.model');
const spotify_data = require('../models/userv2_spotify_data.model');

const bcrypt = require('bcryptjs');

module.exports = {
	updatePermissions(req, res) {
		spotify_data.updateOne({
			id: req.body.user_id},
			{$set: { has_permissions: true }},
			function(err, data) {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!data) {
				return res.status(404).send({message: 'ERRORE GRAVE: permission field non esistente'});
			}
			console.log('[SPOTIFY CONTROLLER] permessi aggiornati correttamente')
		})
	},
	updateAccessToken(req, res) {
		spotify_data.updateOne({
			id: req.body.data_id},
			{$set: {access_token: bcrypt.hashSync(req.body.access_token, 8),
				expires_in: ((new Date().getTime() / 1000) + req.body.expires_in)}},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: access_token field non esistente'})
				}
				console.log('[SPOTIFY CONTROLLER] access token salvato');
			}
		)
	},
	updateRefreshToken(req,res) {
		spotify_data.updateOne({
		id: req.body.data_id}, //cosi trova user invece che dati user, va modificato, conviene
				       //aggiungere funzione che ottiene id dati da user id
			{$set: {access_token: bcrypt.hashSync(req.body.refresh_token, 8)},
			function(err, data) {
				if (err) {
					return res.status(500).send({message: err})
				}
				if (!data) {
					return res.status(404).send({message: 'ERRORE GRAVE: refresh_token field non esistente'})
				}
				console.log('[SPOTIFY CONTROLLER] refresh token salvato');
			}
		})
	},
	initializeTokens(req,res) {
		updateAccessToken(req, res);
		updateRefreshToken(req,res);
	},
	async getAccessToken(perm_id) {
		try {
			var spotData = await spotify_data.findOne({id: perm_id})

			if (!spotData || !spotData.access_token) {
				return res.status(404).send({message: 'dati spotify relativi ad user non trovati'});
			}
			return {
				access_token: spotData.access_token,
				expires_at: spotData.expires_in,
			}
		} catch(error) {
			console.log(error, 'fallimento sign in');
			throw new Error(error.message)
		}
	},
	getRefreshToken(perm_id) {
		spotify_data.findOne({id: perm_id}).exec((err,spotData) => {
			if (err) {
				return res.status(500).send({message: err});
			}
			if (!spotData || !spotData.access_token) {
				return res.status(404).send({message: 'dati spotify relativi ad user non trovati'});
			}
			res.status(200).send({
				refresh_token: spotData.refresh_token,
			})
		})
	}
}
