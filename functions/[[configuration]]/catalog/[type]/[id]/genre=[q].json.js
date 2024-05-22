import { onRequest as fetchCatalog } from "../[id].json.js";

export async function onRequest(context) {
  const { params } = context;
  const { q } = params;

  const catalog = await fetchCatalog(context)
    .then((response) => response.json())
    .then((catalog) => {
      filter(catalog.metas, ({ genres }) => includes(genres, q));
      return catalog;
    });

  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};

/**
 * Filter an array in place
 * @param {Array} array
 * @param {(item: any) => boolean} fn
 */
function filter(array, fn) {
  let from = 0, to = 0;
  while (from < array.length) {
    if (fn(array[from])) {
      array[to] = array[from];
      to++;
    }
    from++;
  }
  array.length = to;
}

/**
 * Checks if array contains needle, case-insensitive
 * @param {Array<T>} array
 * @param {T} needle
 * @returns {boolean}
 */
function includes(array, needle) {
  return array?.some((value) => {
    return value.toLowerCase() === needle.toLowerCase();
  });
}
