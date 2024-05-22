
async function json(endpoint, init = {}) {
  const url = new URL("https://v3-cinemeta.strem.io/meta");
  url.pathname += endpoint;
  const response = await fetch(url);
  return response.json();
}

export async function onRequest(context) {
  const { env, request } = context;
  const { pathname } = new URL(request.url);

  const [
    _id,
    type,
    _resource,
    _configuration,
  ] = pathname.substring(1).split("/").filter(Boolean).reverse();

  const prefix = `${type}:`;

  const {
    keys,
    list_complete,
    cursor,
  } = await env.STREAMS.list({
    prefix,
    limit: 1000, // default
    cursor: "",
  });

  const metas = [];
  for (let {name: key, expiration, metadata} of keys) {
    const [, id] = key.split(":");
    if (metas.find(meta => meta.id === id)) {
      continue;
    }

    if (!metadata) {
      const { meta: { name, genres, poster} }= await json(`/${type}/${id}.json`);
      metadata = {
        type,
        id,
        name,
        genres,
        poster,
      };
      // Cache the metadata
      const value = await env.STREAMS.get(key, { type: "stream" });
      await env.STREAMS.put(key, value, {
        metadata,
      });
    }

    metas.push(metadata);
  }

  return new Response(JSON.stringify({ metas }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
