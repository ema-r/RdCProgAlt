const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {}

db.mongoose = mongoose;

db.UserV2 = require("./userv2.model");
db.UserV2_spotify_data = require("./userv2_spotify_data.model");
db.UserV2_youtube_data = require("./userv2_youtube_data.model");

module.exports = db;
