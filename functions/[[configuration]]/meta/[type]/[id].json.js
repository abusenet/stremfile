/**
 * Fetches meta data for a specific item
 * @param {Object} context
 * @returns
 */
export async function onRequest(context) {
  const { type, id } = context.params;
  const url = new URL("https://v3-cinemeta.strem.io/meta");
  url.pathname += `/${type}/${id}.json`;
  return fetch(url);
}
