const expect = require("chai").expect;
const chai = require('chai');
const chaihttp = require('chai-http');
chai.use(chaihttp);
const app = require('../index');
const fetch = require("node-fetch");
const axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const util = require('node:util');
describe("POST /oauth/login", () => {
  var host = 'https://localhost:8443/';
  it("send bad POST request to https://localhost:8443/oauth/login", async () => {
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

  var token = '';
//  it("send good POST request to https://localhost:8443/oauth/login", async () => {
//    await fetch("https://localhost:8443/oauth/login", {
//      method: "POST",
//      body: JSON.stringify({
//        uname:"dev",
//        pword: "devpass",
//      }),
//      headers: { "Content-Type": "application/json" },
//    })
//      .then((result) => {
//        expect(result.status).to.equal(200);
//      })
//      .catch((err) => {
//        console.error(err.message);
//      })
//      .done;
//  });
  it('should send parameters to : /path POST', function(done) {
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
		    token = response.body.accessToken;
                    done();
                }
            });
  });

  it("send POST request to https://localhost:8443/oauth/login", async () => {
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


//  it('send POST request to https://localhost:8443/oauth/signup', async() => {
//	  await fetch('https://localhost:8443/oauth/signup', {
//		  method: 'POST',
//		  body: JSON.stringify({
//			  uname: 'test',
//			  pword: 'testpword',
//		  }),
//		  headers: {
//			  'Content-Type':  'application/json',
//		  },
//	  }).then((result) => {
//		  expect(result.status).to.equal(200);
//	  }).catch((err)=> {
//		  console.error(err.message);
//	  });
//  });
  
  it('dovrebbe accedere a /api/test fornendo un jwt token', async() => {
	  await fetch('https://localhost:8443/api/test', {
		  method: 'GET',
		  headers: {
			  Authorization: 'Bearer ' + token,
		  },
	  }).then((res) => {
		  expect(res.status).to.equal(200);
	  }).catch((err) => {
		  console.error(err.message);
	  })
    .done;
  });
});
