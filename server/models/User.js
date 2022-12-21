const mongoose = require('mongoose');
module.exports = mongoose.model("User", schema);

const schemaGoogle = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
    },
    givenName: {
      type: String,
      required: true,
    },
    familyName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    picture: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);


const schemaSpotify = new mongoose.Schema(
  {
    spotifyId: {
      type: String,
      required: true,
      unique: true,
    },
  },
    { timestamps: true }
  );