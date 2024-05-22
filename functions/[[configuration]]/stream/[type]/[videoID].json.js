import { filenameParse } from '@ctrl/video-filename-parser';

const WEBSITE_TOKEN = "4fd6sg89d7s6";

const BASE_URL = "https://api.gofile.io";

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
 * @param {Request} request
 * @param {Object} env
 * @returns {Promise<Response>}
 */
async function GET(request, env) {
  const { searchParams, pathname, href } = new URL(request.url);

  const userAgent = request.headers.get("User-Agent") || "Mozilla/5.0";
  const wt = searchParams.get("wt") || env["WEBSITE_TOKEN"] || WEBSITE_TOKEN;

  const [
    videoID,
    type,
    resource,
    configuration,
  ] = pathname.substring(1).split("/").filter(Boolean).reverse();

  const prefix = `${ videoID.replace(/\.json$/, "") }:`;

  const {
    keys,
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

  for (const {name, expiration, metadata} of keys) {
    const folderId = name.replace(new RegExp(`^${prefix}`), "");

    const { childrenIds, children } = await json(`/contents/${folderId}?wt=${wt}`, {
      headers: {
        "Authorization": `Bearer ${account.token}`,
        "User-Agent": userAgent,
      },
    });

    for (const childId of childrenIds) {
      const { name: filename, type, mimetype, size, md5, link } = children[childId];
      if (type !== "file") continue;
      if (!mimetype || !mimetype.includes("video/")) continue;

      const { resolution, sources, videoCodec, edition } = filenameParse(filename);
      let name = `[Gofile] ${resolution} ${sources[0]}`;
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
          "bingeGroup": `Gofile-${resolution}`,
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

  return new Response(JSON.stringify({ streams }, null, 2), {
    headers: new Headers({
      "Content-Type": "application/json; charset=utf-8",
    }),
  });
}

/**
 * Adds a new stream
 * @param {Request} request
 * @param {Object} env
 */
async function POST(request, env) {
  const { searchParams, pathname } = new URL(request.url);
  const [
    videoID,
    type,
    resource,
    configuration,
  ] = pathname.substring(1).split("/").filter(Boolean).reverse();

  const prefix = `${ videoID.replace(/\.json$/, "") }:`;

  const formData = await request.formData();
  const id = formData.get("id");
  const name = formData.get("name");

  env.STREAMS.put(`${prefix}${id}`, name, {
    metadata: undefined,
  });

  return new Response(null, {
    status: 204,
  });
}

export async function onRequest(context) {
  const { env, request } = context;

  if (request.method === "GET") {
    return GET(request, env);
  } else if (request.method === "POST") {
    return POST(request, env);
  }

  return new Response(null, {
    status: 405,
    statusText: "Method Not Allowed",
  });
};

async function getAccount(init = {}) {
  const headers = new Headers(init.headers);

  const { id, token } = await json("/accounts", {
    method: "POST",
    headers,
  });
  headers.set("Authorization", `Bearer ${token}`);
  return json(`/accounts/${id}`, {
    headers,
  });
}

function prettyBytes(size) {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}
