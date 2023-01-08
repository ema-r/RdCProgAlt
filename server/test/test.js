const expect = require("chai").expect;
const chai = require('chai');
const chaihttp = require('chai-http');
chai.use(chaihttp);
const app = require('../index');
const fetch = require("node-fetch");
const axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const util = require('node:util');
var token = '';

describe("test accesso e permessi", () => {
  var host = 'https://localhost:8443/';
  it("login con username e password sbagliati, restituisce 404 poiche non trova utente", async () => {
    await fetch("https://localhost:8443/oauth/login", {
      method: "POST",
      body: JSON.stringify({
        uname:"00000",
        pword: "0000000000000",
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((result) => {
        expect(result.status).to.equal(404);
      })
      .catch((err) => {
        console.error(err.message);
      })
      .done;
  });

  it('login POST test, restituisce token JWT, status 200', function(done) {
        chai
            .request(host)
            .post('oauth/login')
            // .field('myparam' , 'test')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send({uname: 'dev', pword: 'devpass'})
            .end(function(error, response, body) {
                if (error) {
                    done(error);
                } else {
		    expect(response.statusCode).to.equal(200);
		    token = response.body.accessToken;
                    done();
                }
            });
  });

  it("login con username corretto e password sbagliata, restituisce 401", async () => {
    await fetch("https://localhost:8443/oauth/login", {
      method: "POST",
      body: JSON.stringify({
        uname:"dev",
        pword: "000000",
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((result) => {
        expect(result.status).to.equal(401);
      })
      .catch((err) => {
        console.error(err.message);
      })
      .done;
  });

  it ('get request a /api/test, con JWT token sbagliato', async () => {
	  await fetch('https://localhost:8443/api/test', {
		  method: 'GET',
		  headers: {'x-access-token': 'bsebrsfvs3t2y53vgds'},
	  }).then((result) => {
		  expect(result.status).to.equal(401);
	  }).catch((err) => {
		  console.error(err.message);
	  }).done;
  });

  it("GET request a /api/test, con JWT token corretto. Restituisce 200", async () => {
    await fetch("https://localhost:8443/api/test", {
      method: "GET",
      headers: { "x-access-token": token },
    })
      .then((result) => {
        expect(result.status).to.equal(200);
      })
      .catch((err) => {
        console.error(err.message);
      })
      .done;
  });

});

describe("test spotify", () => {
  it("GET request a /api/test, con JWT token corretto. Restituisce 200", async () => {
    await fetch("https://localhost:8443/oauth/spotify/login", {
      method: "GET",
      headers: { "x-access-token": token },
    })
      .then((result) => {
        expect(result.status).to.equal(200);
      })
      .catch((err) => {
        console.error(err.message);
      })
      .done;
  });
});
