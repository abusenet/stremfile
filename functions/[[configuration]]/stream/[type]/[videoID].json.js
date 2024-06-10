import { filenameParse } from "@ctrl/video-filename-parser";
import { onRequest as fetchMeta } from "../../meta/[type]/[id].json.js";
import { imdb } from "../../catalog/[type]/[id]/search=[q].json.js";

const BASE_URL = "https://api.gofile.io";
const WEBSITE_TOKEN = "4fd6sg89d7s6";

/**
 * @param {string} endpoint
 * @param {RequestInit} init
 */
async function json(endpoint, init = {}) {
  const request = new Request(`${BASE_URL}${endpoint}`, init);
  const response = await fetch(request);
  const { status, data }  = await response.json();
  if (status !== "ok") {
    console.error(status);
    return null;
  }
  return data;
}

/**
 * Gets stream data
 * @param {Object} context
 * @param {Object} env
 * @returns {Promise<Response>}
 */
async function GET(context) {
  const { request, env, params } = context;
  const { searchParams, href } = new URL(request.url);
  const { videoID, type } = params;

  console.time(`GET ${ type }/${ videoID }`);

  const userAgent = request.headers.get("User-Agent") || "Mozilla/5.0";
  const wt = searchParams.get("wt") || env["WEBSITE_TOKEN"] || WEBSITE_TOKEN;

  const prefix = `${type}:${ videoID }:`;

  const {
    keys = [],
    list_complete,
    cursor,
  } = await env.STREAMS.list({
    prefix,
    limit: 1000, // default
    cursor: "",
  });

  const streams = [];
  const account = await getAccount({
    headers: {
      "User-Agent": userAgent,
    },
  });

  for (const { name: key, metadata } of keys) {
    const [ , , folderId ] = key.split(":");
    // No cache, fetch from API.
    const folder = await json(`/contents/${folderId}?wt=${wt}`, {
      headers: {
        "Authorization": `Bearer ${account.token}`,
        "User-Agent": userAgent,
      },
    });

    if (!folder) {
      continue;
    }

    const { childrenIds, children } = folder;

    for (const childId of childrenIds) {
      const { name: filename, type, mimetype, size, md5, link } = children[childId];
      if (type !== "file") continue;
      if (!mimetype || !mimetype.includes("video/")) continue;

      const { resolution, sources, videoCodec, edition } = filenameParse(filename);
      let name = `[StremFile] ${resolution} ${sources[0]}`;
      if (filename.includes("HDR") || edition.hdr) {
        name += " HDR";
      }
      if (filename.includes("DV") || edition.dolbyVision) {
        name += " DV";
      }
      name += ` ${videoCodec}`;

      let url = link;
      // Only native StremIO apps send Cookie header, so we point web
      // clients to our proxied content instead.
      if (!userAgent.includes("Stremio/")) {
        url = href.replace(/\.json$/, `/${filename}`);
      }

      streams.push({
        name,
        description: `${filename}\n${prettyBytes(size)}`,
        url,
        behaviorHints: {
          // Set the stream to be a binge group so next episode will play automatically
          "bingeGroup": `StremFile-${resolution}`,
          // Set not to be web ready so it will send headers.
          "notWebReady": true,
          "proxyHeaders": {
            "request": {
              "Content-Type": mimetype,
              "Cookie": `accountToken=${account.token}`,
              "User-Agent": userAgent,
            },
          },
        },
        videoHash: md5,
        videoSize: size,
        filename,
      });
    }
  }

  console.timeEnd(`GET ${ type }/${ videoID }`);

  return new Response(JSON.stringify({ streams }, null, 2), {
    headers: new Headers({
      "Content-Type": "application/json; charset=utf-8",
    }),
  });
}

/**
 * Adds a new stream with metadata
 * @param {Object} context
 * @param {Object} env
 */
async function POST(context) {
  const { request, env, params } = context;
  let { videoID, type } = params;

  console.time(`POST ${ type }/${ videoID }`);

  const file = await request.json();
  // Incoming file name is in the format of folder/filename
  const [folder, filename] = file.name.split("/");
  // But we only need the filename
  file.name = filename;

  // TODO: handle series
  // TODO: handle anime
  if (!videoID.startsWith("tt")) {
    const { title, year } = filenameParse(filename);
    // Retrieve the IMDb ID from IMDB API
    const results = await imdb(`${title} (${year})`, { qid: type });
    videoID = results[0]?.id;
  }

  if (!videoID) {
    return new Response(null, {
      status: 204,
    });
  }

  const id = params.id = videoID;
  const prefix = `${ type }:${ id }:`;

  // Get metadata
  const { meta } = await fetchMeta(context).then((r) => r.json());
  const { name, genres, poster} = meta;
  const metadata = {
    type,
    id,
    name,
    genres,
    poster,
  }

  env.STREAMS.put(`${ prefix }${ folder }`, JSON.stringify(file), {
    metadata,
  });

  console.timeEnd(`POST ${ type }/${ videoID }`);

  return new Response(null, {
    status: 204,
  });
}

async function DELETE(context) {
  const { request, env, params } = context;
  const { videoID, type } = params;

  console.time(`DELETE ${ type }/${ videoID }`);

  const prefix = `${ type }:${ videoID }:`;
  const { keys } = await env.STREAMS.list({ prefix });

  for (const { name: key } of keys) {
    await env.STREAMS.delete(key);
  }

  console.timeEnd(`DELETE ${ type }/${ videoID }`);

  return new Response(null, {
    status: 204,
  });
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "GET") {
    return GET(context);
  } else if (request.method === "POST") {
    return POST(context);
  } else if (request.method === "DELETE") {
    return DELETE(context);
  }

  return new Response(null, {
    status: 405,
    statusText: "Method Not Allowed",
  });
};

async function getAccount(init = {}) {
  const headers = new Headers(init.headers);

  return json("/accounts", {
    method: "POST",
    headers,
  });
}

function prettyBytes(size) {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}
