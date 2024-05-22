import { onRequest as fetchCatalog } from "../[id].json.js";

export async function onRequest(context) {
  const { params } = context;
  const { n } = params;

  const metas = await fetchCatalog(context)
    .then((response) => response.json())
    .then(({ metas }) => metas.slice(Number(n)));

  return new Response(JSON.stringify({ metas }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
