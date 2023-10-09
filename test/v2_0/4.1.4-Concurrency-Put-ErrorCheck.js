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
    /**
     * Presently, If-None-Match is not included in the spec document for xAPI 2.0's LRS requirements.
     * 
     * This seems to be a presumed inclusion, but it will be omitted here until the document explicitly
     * requires its implementation by the LRS.
     */

    describe(`If a PUT request is received without either header for a resource that already exists: (${resourceName})`, function () {
        let originalDocument = helper.buildDocument();
        let updatedDocument = helper.buildDocument();

        before('Create the document and get the etag', async () => {

            await xapiRequests.deleteDocument(resourcePath, resourceParams);
            let postResponse = await xapiRequests.postDocument(resourcePath, originalDocument, resourceParams);

            expect(postResponse.status).to.equal(204);

            let getResponse = await xapiRequests.getDocuments(resourcePath, resourceParams);

            expect(getResponse.status).to.equal(200);
            expect(getResponse.headers.etag).to.not.be.undefined;
            expect(getResponse.data).to.eql(originalDocument);
        });

        it('Return 409 conflict', async () => {
            let res = await xapiRequests.putDocument(resourcePath, updatedDocument, resourceParams);
            expect(res.status).to.equal(409);
        });

        it('Return error message explaining the situation', async () => {
            let res = await xapiRequests.putDocument(resourcePath, updatedDocument, resourceParams);
            let responseText = res.data;

            expect(responseText).is.a("string").with.length.greaterThan(0);
        });

        it('Do not modify the resource', async () => {
            let getResponse = await xapiRequests.getDocuments(resourcePath, resourceParams);

            expect(getResponse.data).to.eql(originalDocument);
        });
    });
}

describe('(4.1.4) Concurrency - PUT - Error Check', () => {

    /**  XAPI-00322, Communication 3.1 Concurrency
     * An LRS must support HTTP/1.1 entity tags (ETags) to implement optimistic concurrency control when handling APIs where PUT may overwrite existing data (State, Agent Profile, and Activity Profile)
     */
    describe("xAPI uses HTTP 1.1 entity tags (ETags) to implement optimistic concurrency control in the following resources, where PUT, POST or DELETE are allowed to overwrite or remove existing data.", function () {

        let stateParams = helper.buildState();
        let activityProfileParams = helper.buildActivityProfile();
        let agentsProfileParams = helper.buildAgentProfile();

        runConcurrencyTestsForDocumentResource("Activity State", xapiRequests.resourcePaths.activityState, stateParams);
        runConcurrencyTestsForDocumentResource("Activity Profile", xapiRequests.resourcePaths.activityProfile, activityProfileParams);
        runConcurrencyTestsForDocumentResource("Agents Profile", xapiRequests.resourcePaths.agentsProfile, agentsProfileParams);
    });
});

