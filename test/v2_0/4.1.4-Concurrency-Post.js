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

    describe('When responding to a PUT, POST, or DELETE request, must handle the If-Match header as described in RFC 2616, HTTP/1.1 if it contains an ETag', async () => {
        describe("Properly handles POST requests with If-Match", function () {

            let document = helper.buildDocument();
            let originalName = document.name;
            let updatedDocument = {
                ...document,
                name: "Updated Name:" + helper.generateUUID()
            }
            var correctTag;

            before("Get the current ETag", async () => {

                await xapiRequests.deleteDocument(resourcePath, resourceParams);
                await xapiRequests.postDocument(resourcePath, document, resourceParams);

                let documentResponse = await xapiRequests.getDocuments(resourcePath, resourceParams);
                correctTag = documentResponse.headers.etag;
            });

            it("Should reject a POST request with a 412 Precondition Failed when using an incorrect ETag", async () => {

                let incorrectTag = "1234";
                let incorrectResponse = await xapiRequests.postDocument(resourcePath, document, resourceParams, { "If-Match": incorrectTag });

                expect(incorrectResponse.status).to.equal(412);
            });

            it("Should not have modified the document for POST requests with an incorrect ETag", async () => {

                let originalDocResponse = await xapiRequests.getDocuments(resourcePath, resourceParams);
                expect(originalDocResponse.data.name).to.equal(originalName);
            });

            it("Should accept a POST request with a correct ETag", async () => {

                let correctResponse = await xapiRequests.postDocument(resourcePath, updatedDocument, resourceParams, { "If-Match": correctTag });
                expect(correctResponse.status).to.equal(204);
            });

            it("Should have modified the document for POST requests with a correct ETag", async () => {

                let updatedResponse = await xapiRequests.getDocuments(resourcePath, resourceParams);
                expect(updatedResponse.data).to.eql(updatedDocument);
            });
        });
    });
}

describe('(4.1.4) Concurrency - POST', () => {

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

