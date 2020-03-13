const chai = require("chai");
const chaiHttp = require("chai-http");
const puppeteer = require("puppeteer");
const express = require("express");
const { PuppeteerHARServer } = require("../lib/puppeteer_har_server");
const {
  PuppeteerHarServerTestClient
} = require("./puppeteer_har_server_test_client");

chai.use(chaiHttp);
chai.should();

const CHROME_RDP_PORT = 9999;
const PUPPETEER_HAR_SERVER_PORT = 3000;
const TEST_APP_PORT = 3001;

describe("PuppeteerHARServer", () => {
  let puppeteerHARServer;
  let testServer;
  let browser;
  let testClient;

  beforeEach(async () => {
    puppeteerHARServer = new PuppeteerHARServer({
      port: PUPPETEER_HAR_SERVER_PORT
    }).start();
    testClient = new PuppeteerHarServerTestClient(puppeteerHARServer);

    const testApp = express();
    testApp.get("/", (req, res) => {
      res.send("Test response");
    });
    testServer = testApp.listen(TEST_APP_PORT);

    browser = await puppeteer.launch({
      headless: process.env.CHROME_DEBUG != "1",
      args: [`--remote-debugging-port=${CHROME_RDP_PORT}`]
    });
  });

  afterEach(() => {
    return Promise.all([
      new Promise(resolve => puppeteerHARServer.close(resolve)),
      new Promise(resolve => testServer.close(resolve)),
      browser.close()
    ]);
  });

  it("should record a HAR", async () => {
    const browserURL = `http://localhost:${CHROME_RDP_PORT}`;
    const createResponse = await testClient.createHarSession(browserURL);
    createResponse.should.have.status(201);

    const { sessionId } = createResponse.body;

    const pages = await browser.pages();
    const currentPage = pages[0];
    const testAppUrl = `http://localhost:${TEST_APP_PORT}/`;
    await currentPage.goto(testAppUrl);

    const destroyResponse = await testClient.destroyHarSession(sessionId);
    destroyResponse.should.have.status(200);

    const har = destroyResponse.body;
    const harEntry = har.log.entries[0];

    harEntry.request.method.should.equal("GET");
    harEntry.request.url.should.equal(testAppUrl);
    harEntry.response.status.should.equal(200);
  }).timeout(10000);
});
