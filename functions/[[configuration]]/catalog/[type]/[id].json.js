import { onRequest as fetchMeta } from "../../meta/[type]/[id].json.js";

export async function onRequest(context) {
  const { env, params } = context;
  const { type } = params;

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
      const catalogId = params.id;
      // Metadata endpoint uses video ID instead.
      params.id = id;

      const { meta } = await fetchMeta(context).then((r) => r.json());
      const { name, genres, poster } = meta;
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

      // Reset the ID
      params.id = catalogId;
    }

    metas.push(metadata);
  }

  return new Response(JSON.stringify({ metas }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
