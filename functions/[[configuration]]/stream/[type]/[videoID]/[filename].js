import { onRequest as fetchStream } from "../[videoID].json.js";

export async function onRequest(context) {
  const { env, request, params } = context;
  const headers = new Headers(request.headers);
  headers.set("User-Agent", "Stremio/1.0");

  const { filename } = params;
  const { streams } = await fetchStream(context).then((r) => r.json());

  const {
    url: directLink,
    behaviorHints: { proxyHeaders },
  } = streams.find((stream) => stream.filename === filename);

  return fetch(directLink, {
    headers: proxyHeaders.request,
  });
}
