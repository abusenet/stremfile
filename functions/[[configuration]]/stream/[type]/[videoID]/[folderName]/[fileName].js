import { filenameParse } from "@ctrl/video-filename-parser";
import { imdb } from "../../../../catalog/[type]/[id]/search=[q].json.js";

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

export async function onRequest(context) {
  const { env, request, params } = context;

  let { method, headers, url } = request;

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
    });
  }

  let { type, videoID, folderName, fileName } = params;
  videoID = decodeURIComponent(videoID);
  folderName = decodeURIComponent(folderName);
  fileName = decodeURIComponent(fileName);

  const isTv = type === "series";

  const file = { name: fileName };

  // TODO: handle anime
  if (!videoID.startsWith("tt")) {
    const {
      title, year,
      seasons, episodeNumbers,
    } = filenameParse(fileName, isTv);
    // Retrieve the IMDb ID from IMDB API
    const results = await imdb(`${title} (${year})`, { qid: type });
    videoID = results[0]?.id;
    if (isTv) {
      videoID += `:${seasons[0]}:${episodeNumbers[0]}`;
    }
  }

  if (!videoID) {
    return new Response(null, {
      status: 404,
    });
  }

  const { pathname, searchParams } = new URL(url);
  headers = new Headers(headers);

  const userAgent = headers.get("User-Agent") || "Mozilla/5.0";
  // Requests can contain the token in the cookie for this path.
  let cookie = headers.get("Cookie");
  const wt = searchParams.get("wt") || env["WEBSITE_TOKEN"] || WEBSITE_TOKEN;

  let cacheControl;
  // Only creates an account if the token is not provided
  if (!cookie) {
    const account = await getAccount({
      headers: {
        "User-Agent": userAgent,
      },
    });

    cookie = `accountToken=${account.token}`;
    cacheControl = "no-cache";
  }

  const key = `${type}:${videoID}:${folderName}`;

  // Populates missing file data from the API
  const folder = await getFolder(`${folderName}?wt=${wt}`, {
    headers: {
      "Authorization": cookie.replace("accountToken=", "Bearer "),
      "Cache-Control": cacheControl,
      "User-Agent": userAgent,
    },
  });

  const { childrenIds, children } = folder;
  let id = childrenIds.find((id) => children[id].name === fileName);

  if (!id) {
    return new Response(null, { status: 404 });
  }

  let { name, mimetype, size, md5, link, createTime } = children[id];

  if (name.endsWith(".mkv") || mimetype === "video/x-matroska") {
    mimetype = "video/webm";
  }

  file.md5 = md5;
  file.type = mimetype;
  file.size = size;
  file.location = link;
  if (!file.lastModified) {
    file.lastModified = createTime * 1000;
  }

  await env.STREAMS.put(key, JSON.stringify(file));

  const range = headers.get("Range");
  headers = new Headers({
    "Cookie": cookie,
    "User-Agent": userAgent,
  });

  if (range) {
    headers.set("Range", range);
  }

  const response = await fetch(file.location, {
    method,
    headers,
  });

  headers = new Headers(response.headers);
  headers.set("Set-Cookie", `${cookie};path=${pathname};SameSite=None;Secure`);

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

async function getAccount(init = {}) {
  const headers = new Headers(init.headers);

  return json("/accounts", {
    method: "POST",
    headers,
  });
}

async function getFolder(name, init = {}) {
  const url = new URL(`${BASE_URL}/contents/${name}`);
  const headers = new Headers(init.headers);
  const cacheControl = headers.get("Cache-Control");
  const cache = caches.default;

  let response;
  if (cacheControl !== "no-cache") {
    response = await cache.match(url);
  }

  if (!response) {
    response = await fetch(url, init);

    const { status, data }  = await response.json();
    if (status !== "ok") {
      console.error(status);
      return null;
    }

    response = Response.json({ status, data }, {
      headers: {
        // Must set some type of duration for CF to cache.
        "Cache-Control": `public, max-age=${60 * 60 * 24}`,
      },
    });

    await cache.put(url, response.clone());
  }

  const { data }  = await response.json();
  return data;
}
