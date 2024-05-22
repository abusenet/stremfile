import * as streamer from "../[videoID].json.js";

export async function onRequest(context) {
  const { env, request, params } = context;
  const headers = new Headers(request.headers);
  headers.set("User-Agent", "Stremio/1.0");

  const { videoID, filename } = params;
  const url = request.url.replace(`/${videoID}/${filename}`, `/${videoID}.json`)

  const { streams } = await streamer.onRequest({
    env,
    request: new Request(url, { headers }),
    params,
  }).then((res) => res.json());

  const {
    url: directLink,
    behaviorHints: { proxyHeaders },
  } = streams.find((stream) => stream.filename === filename);

  return fetch(directLink, {
    headers: proxyHeaders.request,
  });
}
