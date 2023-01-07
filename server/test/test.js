const expect = require("chai").expect;
const chai = require('chai');
const app = require('../index');
const fetch = require("node-fetch");
const axios = require('axios');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe("POST /oauth/login", () => {
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
      });
  });

  let token = '';
  it("send POST request to https://localhost:8443/oauth/login", async () => {
    await fetch("https://localhost:8443/oauth/login", {
      method: "POST",
      body: JSON.stringify({
        uname:"dev",
        pword: "devpass",
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((result) => {
        expect(result.status).to.equal(200);
	res = JSON.parse(result);
	console.log(res);
      })
      .catch((err) => {
        console.error(err.message);
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
      });
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
	  console.log('ultimo test token: ' + token)
	  await fetch('https://localhost:8443/api/test', {
		  method: 'GET',
		  headers: {
			  Authorization: 'Bearer '+token,
		  },
	  }).then((res) => {
		  expect(res.status).to.equal(200);
	  }).catch((err) => {
		  console.error(err.message);
	  });
  });
});
