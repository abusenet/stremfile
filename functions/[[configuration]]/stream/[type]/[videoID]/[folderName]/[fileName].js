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

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  const { searchParams } = new URL(request.url);

  const userAgent = request.headers.get("User-Agent") || "Mozilla/5.0";
  const wt = searchParams.get("wt") || env["WEBSITE_TOKEN"] || WEBSITE_TOKEN;

  const { folderName, fileName }  = params;

  const account = await getAccount({
    headers: {
      "User-Agent": userAgent,
    },
  });

  const cookie = `accountToken=${account.token};path=/;domain=gofile.io;SameSite=Lax;Secure`;

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

  const { name, mimetype, size, md5, link } = children[id];

  // TODO: Upserts the child into KV

  return new Response(null, {
    status: 302,
    headers: {
      "Location": link,
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
