const http = require('http');

// getBrowserVersionMetadata is used to get the remote debugging endpoint for a
// given browser instance. This functionality was added to puppeteer itself in
// version 1.12.0 when using the browserURL option to puppeteer.connect().
// However, versions of puppeteer are closely tied to versions of
// chrome/chromium and it is desirable to use puppeteer-har-server with older
// browser versions. Therefore, we provide this functionality directly in order
// to interoperate with older browser versions.
//
// Relevant commit: https://github.com/puppeteer/puppeteer/commit/15af75f9a24ad9a91ab7cd7a57290e212c8c1c49
//              PR: https://github.com/puppeteer/puppeteer/pull/3558
//           issue: https://github.com/puppeteer/puppeteer/issues/3537
function getBrowserVersionMetadata(browserURL) {
  const url = new URL(browserURL);
  url.pathname = '/json/version';

  return new Promise((resolve, reject) => {
    const request = http.request(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error('Unable to fetch version information'));
        return;
      }

      const responseChunks = [];
      response.setEncoding('utf8');
      response.on('data', (chunk) => responseChunks.push(chunk));
      response.on('end', () => {
        const responseJson = JSON.parse(responseChunks.join(''));
        resolve(responseJson);
      });
    });

    request.on('error', (e) => reject(e));
    request.end();
  });
}

async function getWebsocketEndpoint(browserURL) {
  const versionMetadata = await getBrowserVersionMetadata(browserURL);
  return versionMetadata.webSocketDebuggerUrl;
}

module.exports = {
  getWebsocketEndpoint,
};
