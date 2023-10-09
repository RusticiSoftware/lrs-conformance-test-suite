'use strict';
/**
 * Description : This is a test suite that tests an LRS endpoint based on the testing requirements document
 * found at https://github.com/adlnet/xapi-lrs-conformance-requirements
 */

var request = require('supertest-as-promised');
const expect = require('chai').expect;
const helper = require('../helper');
const xapiRequests = require("./util/requests");

request = request(helper.getEndpoint());

function runConcurrencyTestsForDocumentResource(resourceName, resourcePath, resourceParams) {

    describe(`Concurrency for the ${resourceName} Resource.`, () => {

        let document = helper.buildDocument();

        before('before', async() => {
            await xapiRequests.deleteDocument(resourcePath, resourceParams);
            await xapiRequests.postDocument(resourcePath, document, resourceParams);
        });

        it('An LRS responding to a GET request SHALL add an ETag HTTP header to the response.', async() => {

            let documentResponse = await xapiRequests.getDocuments(resourcePath, resourceParams);
            let etag = documentResponse.headers.etag;

            expect(etag).to.be.a("string");
        });
        
        it('When responding to a GET Request the Etag header must be enclosed in quotes', async() => {

            let documentResponse = await xapiRequests.getDocuments(resourcePath, resourceParams);
            let etag = documentResponse.headers.etag;

            expect(etag).to.be.a("string");

            if (etag[0] !== '"') {
                expect(etag[0]).to.equal('W');
                expect(etag[1]).to.equal('/');
                etag = str.substring(2)
            }
            
            expect(etag[0]).to.equal('"');
            expect(etag[41]).to.equal('"');
        });
    });
}

describe('(4.1.4) Concurrency - GET', () => {

    /**  XAPI-00322, Communication 3.1 Concurrency
     * An LRS must support HTTP/1.1 entity tags (ETags) to implement optimistic concurrency control when handling APIs where PUT may overwrite existing data (State, Agent Profile, and Activity Profile)
     */
    describe("xAPI uses HTTP 1.1 entity tags (ETags) to implement optimistic concurrency control in the following resources, where PUT, POST or DELETE are allowed to overwrite or remove existing data.", function() {

        let stateParams = helper.buildState();
        let activityProfileParams = helper.buildActivityProfile();
        let agentsProfileParams = helper.buildAgentProfile();

        runConcurrencyTestsForDocumentResource("Activity State", xapiRequests.resourcePaths.activityState, stateParams);
        runConcurrencyTestsForDocumentResource("Activity Profile", xapiRequests.resourcePaths.activityProfile, activityProfileParams);
        runConcurrencyTestsForDocumentResource("Agents Profile", xapiRequests.resourcePaths.agentsProfile, agentsProfileParams);
    });
});

