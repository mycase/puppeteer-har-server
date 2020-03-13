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

const PUPPETEER_HAR_SERVER_PORT = 3000;

function startServer(sessionManager) {
  const harServer = new PuppeteerHARServer({
    sessionManager,
    port: PUPPETEER_HAR_SERVER_PORT
  });
  return harServer.start();
}

function stopServer(server) {
  return new Promise(resolve => server.close(resolve));
}

describe("PuppeteerHARServer", () => {
  describe("POST /har-sessions", () => {
    it("should return 400 if browserURL is unspecified", async () => {
      const server = startServer();
      const client = new PuppeteerHarServerTestClient(server);

      const response = await client.createHarSession(null);
      response.should.have.status(400);
      response.body.should.deep.equal({ error: "Missing browserURL" });

      await stopServer(server);
    });

    it("should return 500 if session creation fails with unexpected error", async () => {
      const server = startServer({
        startSession(browserURL) {
          throw new Error("Unexpected error");
        }
      });
      const client = new PuppeteerHarServerTestClient(server);

      const response = await client.createHarSession("http://localhost:1337");
      response.should.have.status(500);
      response.body.should.deep.equal({});

      await stopServer(server);
    });

    it("should return session ID as string if the session was successfully created", async () => {
      const server = startServer({
        startSession(browserURL) {
          return 42;
        }
      });
      const client = new PuppeteerHarServerTestClient(server);

      const response = await client.createHarSession("http://localhost:1337");
      response.should.have.status(201);
      response.body.should.deep.equal({ sessionId: "42" });

      await stopServer(server);
    });
  });

  describe("DELETE /har-sessions/:sessionId", () => {
    it("should return 404 if sessionId does not correspond to an existing session", async () => {
      const server = startServer();
      const client = new PuppeteerHarServerTestClient(server);

      const response = await client.destroyHarSession("bogus");
      response.should.have.status(404);
      response.body.should.deep.equal({ error: "Unknown session bogus" });

      await stopServer(server);
    });

    it("should return 500 if session deletion fails with unexpected error", async () => {
      const server = startServer({
        stopSession(sessionId) {
          throw new Error("Unexpected error");
        }
      });
      const client = new PuppeteerHarServerTestClient(server);

      const response = await client.destroyHarSession("234234");
      response.should.have.status(500);
      response.body.should.deep.equal({});

      await stopServer(server);
    });

    it("should return a HAR if the session was successfully deleted", async () => {
      const server = startServer({
        stopSession(sessionId) {
          return { log: "hardeehar" };
        }
      });
      const client = new PuppeteerHarServerTestClient(server);

      const response = await client.destroyHarSession("234234");
      response.should.have.status(200);
      response.body.should.deep.equal({ log: "hardeehar" });

      await stopServer(server);
    });
  });
});
