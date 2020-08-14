const prerender = require("prerender");
const prMemoryCache = require("prerender-memory-cache");
const prS3Cache = require("./s3-cache");

const memCache = Number(process.env.MEMORY_CACHE) || 0;
const s3Cache = Number(process.env.S3_CACHE) || 0;
const server = prerender({
  chromeFlags: [
    "--no-sandbox",
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--hide-scrollbars",
    "--disable-dev-shm-usage",
  ],
  chromeLocation: process.env.CHROME_BIN,
});

server.use(prerender.httpHeaders());
server.use(prerender.removeScriptTags());

if (memCache === 1) {
  console.log("Using memory cache");
  server.use(prMemoryCache);
} else if (s3Cache === 1) {
  console.log("Using s3 cache");
  server.use(prS3Cache());
}
server.start();
