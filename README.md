# puppeteer-har-server

This project exposes functionality offered by [`puppeteer-har`][0] over an HTTP interface. With it, you can start recording HTTP traffic on a running instance of Chrome and retrieve that HTTP traffic as an HTTP archive (`.har`).

[0]: https://github.com/Everettss/puppeteer-har

This project was developed as a way to capture HTTP traffic during automated acceptance testing. You can configure your tests to start Chrome with `--remote-debugging-port=9222`. Before each test starts, begin a HAR recording session. When the test completes, stop the session. Write the HAR archive out to disk and save it as an artifact in your CI pipeline for later inspection.

## Usage

```
npm start
```

This exposes a server running on port 3000. If you'd like to use a different port, specify it using the `PORT` environment variable.

```
PORT=8080 npm start
```

## API Documentation

### `POST /har-sessions`

Accepts a JSON-encoded request body. It must contain the key `browserURL`, which corresponds to a Chrome instance's Remote Debugging Protocol interface.

It returns a JSON-encoded response body, containing the key `sessionId`.

#### Example

```sh
curl -d '{"browserURL":"http://localhost:9222"}' -H "Content-Type: application/json" -X POST http://localhost:3000/har-sessions
```

```
{"sessionId":"3"}
```

### `DELETE /har-sessions/:sessionId`

Accepts a `sessionId` in the `path`. Returns a JSON-encoded response body, containing a HTTP Archive (HAR) with all of the requests from the recording.

#### Example

```sh
curl -X DELETE http://localhost:3000/har-sessions/3
```

```
{"log":{"version":1.2",...
```

## Running tests

To run tests for this project, execute `npm test`. Integration tests drive a real instance of Chromium, but it is headless by default. To use a non-headless instance of Chromium during test execution, use the `CHROME_DEBUG` environment variable.

```
CHROME_DEBUG=1 npm test
```
