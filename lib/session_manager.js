const puppeteer = require("puppeteer-core");
const PuppeteerHar = require("puppeteer-har");

const { SessionNotFound } = require("./errors");
const { getWebsocketEndpoint } = require("./websocket_endpoint");

class SessionManager {
  activeSessions = {};
  nextSessionId = 0;

  async startSession(browserURL) {
    const sessionId = this.nextSessionId++;

    console.log(`Starting session ${sessionId} on browser at ${browserURL}`);

    const browserWSEndpoint = await getWebsocketEndpoint(browserURL);
    const browser = await puppeteer.connect({
      browserWSEndpoint,
      defaultViewport: null
    });

    const pages = await browser.pages();
    const page = pages[0];

    const har = new PuppeteerHar(page);
    await har.start();

    this.activeSessions[sessionId] = { browser, har };

    return sessionId;
  }

  async stopSession(sessionId) {
    console.log(`Stopping session ${sessionId}`);

    if (!(sessionId in this.activeSessions)) {
      throw new SessionNotFound();
    }

    const { har, browser } = this.activeSessions[sessionId];

    const content = await har.stop();
    await browser.disconnect();
    delete this.activeSessions[sessionId];

    return content;
  }
}

module.exports = {
  SessionManager
};
