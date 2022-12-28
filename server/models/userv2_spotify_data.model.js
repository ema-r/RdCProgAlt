const mongoose = require("mongoose");

const UserV2_spotify_data = mongoose.model(
	"UserV2_spotify_data",
	new mongoose.Schema({
		has_permission: {
			type:Boolean,
			default: false
		},
		access_token: String,
		expires_in: String,
		refresh_token: String
	})
);

module.exports = UserV2_spotify_data;

