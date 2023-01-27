const mongoose = require("mongoose");

const UserV2 = mongoose.model(
	"UserV2",
	new mongoose.Schema({
		uname: {
			type: String,
			unique: true
		},
		pword: String,
		api_sc: String,
		spotify_has_permission: {
			type: Boolean,
			default: false
		},
		youtube_has_permission: {
			type: Boolean,
			default: false
		},
		spotify_access_token: String,
		spotify_expires_in: Number,
		spotify_refresh_token: String,
		youtube_access_token: String,
		youtube_id_token: String,
		youtube_expires_in: Number,
		youtube_refresh_token: String,
		sancrispino: Boolean
	})
);

module.exports = UserV2;
