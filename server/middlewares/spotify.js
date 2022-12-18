const express = require('express')
const app = express()
const passport = require('passport')
const SpotifyStrategy = require('passport-spotify').Strategy;

passport.use(
  new SpotifyStrategy(
    {
      clientID: client_id,
      clientSecret: client_secret,
      callbackURL: 'http://localhost:8888/auth/spotify/callback'
    },
    function(accessToken, refreshToken, expires_in, profile, done) {
      User.findOrCreate({ spotifyId: profile.id }, function(err, user) {
        return done(err, user);
      });
    }
  )
);
app.get('/', passport.authenticate('spotify'), (req, res)=>{
    res.redirect('http://localhost:3001/user')
}) 
app.get('/user', (req, res) => {
    if(req.user == undefined){res.status(401).redirect('http://localhost:3001/')}else{res.send(req.user)}
})

module.exports = app