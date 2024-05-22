import { onRequest as fetchCatalog } from "../[id].json.js";

/**
 * @typedef {Object} Media
 * @property {Image} i - Image of the media
 * @property {string} id
 * @property {string} l - Title of the media
 * @property {'feature'|'TV movie'|'TV series'} q - Quality of the media
 * @property {'movie'|'tvMovie'|'tvSeries'} qid - Quality ID of the media
 * @property {number} rank - Rank of the media
 * @property {string} s - Stars of the media
 * @property {number} y - Year of the media
 * @property {string} [yr] - Year range of the media
 */

/**
 * @typedef {Object} Image
 * @property {number} width
 * @property {number} height
 * @property {string} imageUrl
 */

/**
 * Returns IMDB ID for the given query
 * @param {string} query
 * @returns {Promise<Media[]>}
 */
async function imdb(query) {
  const url = new URL("https://sg.media-imdb.com/suggestion/");
  url.pathname += query[0].toLowerCase();
  url.pathname += "/" + encodeURIComponent(query) + ".json";

  const { d: results } = await fetch(url).then((r) => r.json());
  return results;
}

export async function onRequest(context) {
  const { params } = context;
  const { type, q } = params;

  const [ catalog, medias ] = await Promise.all([
    fetchCatalog(context).then((response) => response.json()),
    imdb(q),
  ]);

  const ids = medias
    .filter(({ qid }) => qid?.replace("tv", "").toLowerCase() === type)
    .map(({ id }) => id);

  filter(catalog.metas, ({ id }) => ids.includes(id));

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
