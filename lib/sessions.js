const puppeteer = require("puppeteer-core");
const PuppeteerHar = require("puppeteer-har");

const { getWebsocketEndpoint } = require("./websocket_endpoint");

const activeSessions = {};
let nextSessionId = 0;

async function startSession(browserURL) {
  const sessionId = nextSessionId++;

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

  activeSessions[sessionId] = { browser, har };

  return sessionId;
}

async function stopSession(sessionId) {
  console.log(`Stopping session ${sessionId}`);

  if (!(sessionId in activeSessions)) {
    throw new SessionNotFound();
  }

  const { har, browser } = activeSessions[sessionId];

  const content = await har.stop();
  await browser.disconnect();
  delete activeSessions[sessionId];

  return content;
}

module.exports = {
  startSession,
  stopSession
};
