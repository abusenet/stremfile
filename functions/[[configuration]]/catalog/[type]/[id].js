export function onRequest(context) {
  const catalog = {
    "metas": [],
  }

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};