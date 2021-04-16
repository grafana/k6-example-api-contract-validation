import { describe } from './expect.js';
import { Httpx, Get } from 'https://jslib.k6.io/httpx/0.0.4/index.js';
import { randomString } from "https://jslib.k6.io/k6-utils/1.0.0/index.js";

import { 
  registerAPIcontract,
  crocodileAPIContract, 
  crocodileListAPIcontract,
  registerAPIResponseContract } from './api_contracts/contracts.js'


import Ajv from 'https://jslib.k6.io/ajv/6.12.5/index.js';


export let options = {
  thresholds: {
    // fail the test if any checks fail or any requests fail
    checks: [{ threshold: 'rate == 1.00', abortOnFail: true }],
    http_req_failed: [{ threshold: 'rate == 0.00', abortOnFail: true }],
  },
  vus: 1,
  iterations: 1,
};

let session = new Httpx();
session.setBaseUrl('https://test-api.k6.io');

function validateContractsCrocodileService(){

  describe('[Crocs service] Fetch public crocs', (t) => {
    let responses = session.batch([
      new Get('/public/crocodiles/1/'),
      new Get('/public/crocodiles/2/'),
    ]);

    responses.forEach(response => {
      t.expect(response.status).as("response status").toEqual(200)
        .and(response).toHaveValidJson() 
        .and(response.json()).as("Croc API schema").toMatchAPISchema(crocodileAPIContract)
    });
  });

  describe('[Crocs service] Fetch list of crocs', (t) => {
    let response = session.get('/public/crocodiles');

    t.expect(response.status).as("response status").toEqual(200)
      .and(response).toHaveValidJson() 
      .and(response.json()).as("Croc List schema").toMatchAPISchema(crocodileListAPIcontract)
  })
}

function validateAuthService(){

  describe("[Auth service] user registration", (t) => {

    const USERNAME = `${randomString(10)}@example.com`; 
    const PASSWORD = 'superCroc2021';

    let sampleUser = {
      'username': USERNAME,
      'password': PASSWORD,
      'email': USERNAME,
      'first_name': 'John',
      'last_name': 'Smith'
    };

    t.expect(sampleUser).as("user registration").toMatchAPISchema(registerAPIcontract);

    let response = session.post(`/user/register/`, sampleUser);

    console.log(response.body)

    t.expect(response.status).toEqual(201);
    t.expect(response).toHaveValidJson();
    t.expect(response.json()).as("registration response").toMatchAPISchema(registerAPIResponseContract);
  });

}

export default function testSuite() {
  validateContractsCrocodileService();
  validateAuthService();
}

