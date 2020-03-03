const express = require("express");

const { SessionNotFound } = require("./errors");
const { startSession, stopSession } = require("./sessions");

class PuppeteerHARServer {
  constructor({ port }) {
    this.port = port;

    const app = express();

    app.use(express.json());

    app.post("/har-sessions", async (req, res, next) => {
      const { browserURL } = req.body;
      if (!browserURL) {
        res.status(400).json({ error: "Missing browserURL" });
        return;
      }

      try {
        const sessionId = await startSession(browserURL);
        res.status(201).json({ sessionId: sessionId.toString() });
      } catch (e) {
        next(e);
      }
    });

    app.delete("/har-sessions/:sessionId", async (req, res, next) => {
      const { sessionId } = req.params;

      try {
        const har = await stopSession(sessionId);
        res.status(200).json(har);
      } catch (e) {
        if (e instanceof SessionNotFound) {
          res.status(404).json({ error: `Unknown session ${sessionId}` });
        } else {
          next(e);
        }
      }
    });

    this.app = app;
  }

  start() {
    return this.app.listen(this.port);
  }
}

module.exports = {
  PuppeteerHARServer
};
