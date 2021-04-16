import { describe } from 'https://jslib.k6.io/expect/0.0.4/index.js';
import { Httpx, Get } from 'https://jslib.k6.io/httpx/0.0.4/index.js';
import { randomString } from "https://jslib.k6.io/k6-utils/1.0.0/index.js";
import { crocodileAPIContract, crocodileListAPIcontract } from './api_contracts/contracts.js'


if(!crocodileAPIContract)
throw("No contract", crocodileAPIContract)
if(!crocodileListAPIcontract)
throw("No contract", crocodileListAPIcontract)

export let options = {
  thresholds: {
    // fail the test if any checks fail or any requests fail
    checks: [{ threshold: 'rate == 1.00', abortOnFail: true }],
    http_req_failed: [{ threshold: 'rate == 0.00', abortOnFail: true }],
  },
  vus: 1,
  iterations: 1,
};

const USERNAME = `user_${randomString(10)}@example.com`;  
const PASSWORD = 'superCroc2019';

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

export default function testSuite() {
  validateContractsCrocodileService();

}

