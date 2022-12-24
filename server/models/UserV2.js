const mongoose = require("mongoose");

const UserV2 = mongoose.model(
	"UserV2",
	new mongoose.Schema({
		uname: {
			type: String,
			unique: true
		},
		pword: String,
		api_id: {
			type: String,
			unique: true
		},
		api_sc: String,
		spotify_data: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "UserV2_spotify_data",
			required: true
		}
		youtube_data: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "UserV2_youtube_data",
			required: true
		}
	})
);

module.exports = UserV2;
