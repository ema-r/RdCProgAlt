const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {}

db.mongoose = mongoose;

db.UserV2 = require("./UserV2.model");
db.UserV2_spotify_data = require("./UserV2_spotify_data.model");
db.UserV2_youtube_data = require("./UserV2_youtube_data.model");

module.exports = db;
