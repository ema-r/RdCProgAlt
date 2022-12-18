const dotenv = require("dotenv");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const SpotifyStrategy = require('passport-spotify').Strategy;

const { sendWelcomeMail } = require("../middlewares/mailer");

const User = require("../models/User");

dotenv.config({ path: "./config/.env" });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID || "",
      clientSecret: process.env.CLIENT_SECRET || "",
      callbackURL: process.env.REDIRECT_URI || "",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      req.session.accessToken = accessToken;
      req.session.refreshToken = refreshToken;
      const loggedUser = {
        googleId: profile.id,
        givenName: profile.name.givenName,
        familyName: profile.name.familyName,
        email: profile.emails[0].value,
        picture: profile.photos[0].value,
      };
      await User.findOne({ googleId: loggedUser.googleId })
        .then(async (result) => {
          if (!result) {
            result = await User.create(loggedUser);
            sendWelcomeMail(loggedUser.email);
          }
          return done(null, result);
        })
        .catch((err) => {
          console.error(err.message);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  return done(null, user);
});

passport.deserializeUser(async (user, done) => {
  await User.findOne({ googleId: user.googleId })
    .then((result) => {
      return done(null, result);
    })
    .catch((err) => {
      console.error(err.message);
    });
});

module.exports = passport;



//guida nuova



passport.use(
  new SpotifyStrategy(
    {
      clientID: "ad93b64f98894cd88782a141b4fa6698",
      clientSecret: "4c3816b56e984cdbb90e6840e82039c2",
      callbackURL: "https://localhost:8443/spot/callback"
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      User.findOrCreate({ spotifyId: profile.id }, function(err, user) {
        return done(err, user);
      });
    }
  )
);
