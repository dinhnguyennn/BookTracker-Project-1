const http = require("node:http");
const { readFile } = require("node:fs/promises");
const { join } = require("node:path");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 8001);
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/books.json", ["books.json", "application/json; charset=utf-8"]],
]);

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  const path = request.url.split("?")[0];
  const asset = files.get(path) ||
    (/^\/covers\/s\d{1,3}\.jpg$/.test(path) ? [path.slice(1), "image/jpeg"] : null);

  if (!asset) {
    response.writeHead(404).end();
    return;
  }

  const [filename, type] = asset;
  try {
    const content = await readFile(join(__dirname, filename));
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": content.length,
      "Cache-Control": "no-cache",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500).end();
  }
});

server.on("error", (error) => {
  console.error(error.code === "EADDRINUSE" ? `Cổng ${port} đang được sử dụng.` : error.message);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`BookTracker: http://${host}:${server.address().port}/`);
});
