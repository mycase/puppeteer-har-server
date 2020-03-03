const { PuppeteerHARServer } = require("./puppeteer_har_server");

const port = 3000;
const server = new PuppeteerHARServer({ port });

server.start();
