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

  const userAgent = request.headers.get("User-Agent") || "Mozilla/5.0";
  const wt = searchParams.get("wt") || env["WEBSITE_TOKEN"] || WEBSITE_TOKEN;

  const { type, videoID, folderName, fileName }  = params;

  const account = await getAccount({
    headers: {
      "User-Agent": userAgent,
    },
  });

  const cookie = `accountToken=${account.token};path=/;domain=gofile.io;SameSite=Lax;Secure;`;

  const key = `${type}:${videoID}:${folderName}`;
  const {
    value: file = {},
    metadata,
  } = await env.STREAMS.getWithMetadata(key, { type: "json" });

  // Populates missing file data from the API
  if (!file.location) {
    const folder = await json(`/contents/${folderName}?wt=${wt}`, {
      headers: {
        "Authorization": `Bearer ${account.token}`,
        "User-Agent": userAgent,
      },
    });

    const { childrenIds, children } = folder;
    let id = childrenIds.find((id) => children[id].name === fileName);

    if (!id) {
      return new Response(null, { status: 404 });
    }

    let { name, mimetype, size, md5, link } = children[id];

    if (name.endsWith(".mkv") || mimetype === "video/x-matroska") {
      mimetype = "video/webm";
    }

    file.md5 = md5;
    file.type = mimetype;
    file.size = size;
    file.location = link;

    await env.STREAMS.put(key, JSON.stringify(file), { metadata });
  }

  return Response.json(file, {
    status: 302,
    headers: {
      "Location": file.location,
      "Set-Cookie": cookie,
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
