/**
 * A Function worker to run scheduled events
 *
 * Besides serving as a way to test Cron Trigger locally, this worker
 * can be fetched by an actual scheduler Worker.
 */

import { onRequest as fetchStream } from "./[[configuration]]/stream/[type]/[videoID]/[folderName]/[fileName].js";

const MILLISECONDS_IN_A_DAY = 60 * 60 * 24 * 1000;

/**
 * @typedef {Object} ScheduledEvent
 * @property {string} [type="scheduled"]
 * @property {string} cron
 * @property {number} scheduledTime
 */

/**
 * Runs scheduled jobs
 * @param {ScheduledEvent} event
 * @param {Object} env
 * @param {{ waitUntil: (Promise) => void }} context
 */
export async function scheduled(event, env, context) {
  const scheduledTime = new Date(event.scheduledTime);

  // Retrieves all streams
  const {
    keys,
    list_complete,
    cursor,
  } = await env.STREAMS.list({
    limit: 1000, // default
    cursor: "",
  });

  const headers = new Headers({
    "User-Agent": "Mozilla/5.0",
  });

  const now = Date.now();

  for (let {name: key, expiration, metadata} of keys) {
    const [type, videoID, folderName] = key.split(":");

    const file = await env.STREAMS.get(key, { type: "json" });
    const fileName = file.name;
    const lastModifed = file.lastModifed;

    // If the lastModified is less than a day ago, skip.
    if ((now - lastModifed) < MILLISECONDS_IN_A_DAY) {
      continue;
    }

    // Get the link to the stream
    const url = new URL("https://stremio.com");
    url.pathname = `/stream/${type}/${videoID}/${folderName}/${fileName}`;
    const request = new Request(url);
    const params = {
      type,
      videoID,
      folderName,
      fileName,
    }
    let response = await fetchStream({ request, env, params });

    const location = response.headers.get("Location");
    const cookie = response.headers.get("Set-Cookie")?.split(";")[0];
    headers.set("Cookie", cookie);

    response = await fetch(location, {
      method: "HEAD",
      headers,
    });

    if (response.ok) {
      file.lastModifed = now;

      await env.STREAMS.put(key, JSON.stringify(file), {
        metadata,
      });
    }
  }
}

/**
 * Executes a scheduled event
 * @param {import("./index.js").Context} context
 * @returns {Response}
 */
export async function onRequest(context) {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const cron = searchParams.get("cron");
  const scheduledTime = Number(searchParams.get("scheduledTime")) || Date.now();

  await scheduled({ cron, scheduledTime }, env, context);

  return new Response("Ran scheduled event");
}
