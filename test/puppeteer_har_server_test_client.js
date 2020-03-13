const chai = require("chai");

class PuppeteerHarServerTestClient {
  constructor(server) {
    this.server = server;
  }

  createHarSession(browserURL) {
    return new Promise((resolve, reject) => {
      chai
        .request(this.server)
        .post("/har-sessions")
        .send({ browserURL })
        .end((err, res) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(res);
        });
    });
  }

  destroyHarSession(sessionId) {
    return new Promise((resolve, reject) => {
      chai
        .request(this.server)
        .delete(`/har-sessions/${sessionId}`)
        .end((err, res) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(res);
        });
    });
  }
}

module.exports = {
  PuppeteerHarServerTestClient
};
