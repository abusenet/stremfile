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

  if (request.method !== "GET") {
    return new Response(null, {
      status: 204,
    });
  }

  const { searchParams } = new URL(request.url);
  const headers = new Headers(request.headers);

  const userAgent = headers.get("User-Agent") || "Mozilla/5.0";
  // Requests can contain the token in the cookie.
  let cookie = headers.get("Cookie");
  const wt = searchParams.get("wt") || env["WEBSITE_TOKEN"] || WEBSITE_TOKEN;

  // Only creates an account if the token is not provided
  if (!cookie) {
    const account = await getAccount({
      headers: {
        "User-Agent": userAgent,
      },
    });

    cookie = `accountToken=${account.token}`;
  }

  const token = cookie.split("=")[1];

  let { type, videoID, folderName, fileName }  = params;
  fileName = decodeURIComponent(fileName);

  // TODO: handle series
  // TODO: handle anime
  if (!videoID.startsWith("tt")) {
    const { title, year } = filenameParse(fileName);
    // Retrieve the IMDb ID from IMDB API
    const results = await imdb(`${title} (${year})`, { qid: type });
    videoID = results[0]?.id;
  }

  if (!videoID) {
    return new Response(null, {
      status: 404,
    });
  }

  params.id = videoID;

  const key = `${type}:${videoID}:${folderName}`;
  const file = { name: fileName };

  // Populates missing file data from the API
  const folder = await json(`/contents/${folderName}?wt=${wt}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
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

  return Response.json(file, {
    status: 302,
    headers: {
      "Location": file.location,
      "Set-Cookie": `${cookie};path=/;domain=gofile.io;SameSite=Lax;Secure`,
    },
  });
}

async function getAccount(init = {}) {
  const headers = new Headers(init.headers);

  return json("/accounts", {
    method: "POST",
    headers,
  });
}
