import { describe } from 'https://jslib.k6.io/expect/0.0.5/index.js';
import { Httpx, Get } from 'https://jslib.k6.io/httpx/0.0.4/index.js';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.0.0/index.js';

import { 
  registerAPIcontract,
  crocodileAPIContract, 
  crocodileListAPIcontract,
  registerAPIResponseContract,
  tokenAuthResponseAPIcontract,
  tokenAuthRequestAPIcontract} from './api_contracts/contracts.js'

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

function validateContractsPublicCrocodileService(){

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

  const USERNAME = `${randomString(10)}@example.com`;
  const PASSWORD = 'superCroc2021';

  describe("[Registration service] user registration", (t) => {
    let sampleUser = {
      'username': USERNAME,
      'password': PASSWORD,
      'email': USERNAME,
      'first_name': 'John',
      'last_name': 'Smith'
    };

    t.expect(sampleUser).as("user registration").toMatchAPISchema(registerAPIcontract);

    let response = session.post(`/user/register/`, sampleUser);

    t.expect(response.status).toEqual(201);
    t.expect(response).toHaveValidJson();
    t.expect(response.json()).as("registration response").toMatchAPISchema(registerAPIResponseContract);
  });

  describe("[Auth service] user authentication", (t) => {
    let authData = {
      username: USERNAME,
      password: PASSWORD
    };

    t.expect(authData).as("Auth data payload").toMatchAPISchema(tokenAuthRequestAPIcontract);

    let resp = session.post(`/auth/token/login/`, authData);

    t.expect(resp.status).as("Auth status").toBeBetween(200, 204)
      .and(resp).toHaveValidJson()
      .and(resp.json()).as("Auth response").toMatchAPISchema(tokenAuthResponseAPIcontract) // did they reply with the right format?
      .and(resp.json('access')).as("auth token").toBeTruthy();

    let authToken = resp.json('access');
    // set the authorization header on the session for the subsequent requests.
    session.addHeader('Authorization', `Bearer ${authToken}`);

  });
}


function validateContractCreateCrocodileService(){
  // authentication happened before this call.

  describe('[Croc service] Create a new crocodile', (t) => {
    let payload = {
      name: `Croc Name`,
      sex: "M",
      date_of_birth: '2019-01-01',
    };

    let resp = session.post(`/my/crocodiles/`, payload);

    t.expect(resp.status).as("Croc creation status").toEqual(201)
      .and(resp).toHaveValidJson()
      .and(resp.json()).toMatchAPISchema(crocodileAPIContract);

    session.newCrocId = resp.json('id'); // caching croc ID for the future.
  });

  describe('[Croc service] Fetch private crocs', (t) => {
    let response = session.get('/my/crocodiles/');

    t.expect(response.status).as("response status").toEqual(200)
      .and(response).toHaveValidJson()
      .and(response).toMatchAPISchema(crocodileListAPIcontract)
      .and(response.json().length).as("number of crocs").toEqual(1);
  })


}

export default function testSuite() {
  validateContractsPublicCrocodileService();
  validateAuthService();
  validateContractCreateCrocodileService();
}

