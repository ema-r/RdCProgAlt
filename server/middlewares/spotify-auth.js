const express = require('express');
const cookieParser = require('cookie-parser');
const request = require('request-promise-native');
const {URL, URLSearchParams} = require('url');

const SPOTIFY_AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const STATE_KEY = 'spotify_auth_state';

module.exports = function(options = {}) {
  const {client_id_spotify, client_secret_spotify, redirect_uri_spotify} = options;
  const credentials = new Buffer(`${client_id_spotify}:${client_secret_spotify}`).toString('base64');
  const requestToken = function(form) {
    return request.post({
      url: SPOTIFY_TOKEN_ENDPOINT,
      headers: {'Authorization': `Basic ${credentials}`},
      json: true,
      form
    });
  };

  const app = express();
  
  app.get('/login/spotify', (req, res) => {
    const url = new URL(SPOTIFY_AUTHORIZE_ENDPOINT);
    const params = new URLSearchParams();
    const state = generateRandomString(16);

    params.append('client_id', client_id_spotify);
    params.append('redirect_uri', redirect_uri_spotify);
    params.append('response_type', 'code');
    params.append('scope', 'user-read-private user-read-email');
    params.append('state', state);

    url.search = params.toString();

    res.cookie(STATE_KEY, state);
    res.render(href="partials/spotify_redirect")
  });

  app.get('/callback', cookieParser(), async (req, res) => {
    const params = new URLSearchParams();
    const {code, state} = req.query;
    const storedState = req.cookies[STATE_KEY];

    if (!storedState || storedState !== state) {
      params.append('error', 'state_mismatch');
    } else {
      res.clearCookie(STATE_KEY);

      try {
        const response = await requestToken({
          grant_type: 'authorization_code', code, redirect_uri
        });
        const {access_token, refresh_token} = response;
        params.append('access_token', access_token);
        params.append('refresh_token', refresh_token);
      } catch (error) {
        params.append('error', 'invalid_token');
      }
    }

    res.redirect(`/#${params}`);
  });

  app.get('/refresh_token', async (req, res) => {
    const {refresh_token} = req.query;
    let access_token;

    try {
      const response = await requestToken({grant_type: 'refresh_token', refresh_token});
      access_token = response.access_token;
    } catch (error) {
      access_token = null;
    }

    res.send({access_token});
  });

  return app;
}

function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;


}
