import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(".");
const clientRoot = join(root, "dist", "client");
const serverUrl = pathToFileURL(join(root, "dist", "server", "index.js"));
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.HOST ?? "127.0.0.1";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const { default: worker } = await import(serverUrl.href);

async function staticResponse(pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = normalize(join(clientRoot, decoded));

  if (!target.startsWith(clientRoot)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const body = await readFile(target);
    const type = contentTypes[extname(target)] ?? "application/octet-stream";
    return new Response(body, { headers: { "content-type": type } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

const server = createServer(async (incoming, outgoing) => {
  const url = new URL(incoming.url ?? "/", `http://${host}:${port}`);

  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname === "/logo.svg" ||
    url.pathname === "/favicon.svg"
  ) {
    const asset = await staticResponse(url.pathname);
    outgoing.writeHead(asset.status, Object.fromEntries(asset.headers));
    outgoing.end(Buffer.from(await asset.arrayBuffer()));
    return;
  }

  const request = new Request(url, {
    headers: incoming.headers,
    method: incoming.method,
  });

  const response = await worker.fetch(
    request,
    {
      ASSETS: {
        fetch: async (assetRequest) => {
          const assetUrl = new URL(assetRequest.url);
          return staticResponse(assetUrl.pathname);
        },
      },
    },
    {
      passThroughOnException() {},
      waitUntil() {},
    },
  );

  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
});

server.listen(port, host, () => {
  console.log(`APEC Lagos preview running at http://${host}:${port}`);
});
