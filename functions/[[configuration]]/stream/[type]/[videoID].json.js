import { filenameParse } from "@ctrl/video-filename-parser";
import { onRequest as fetchMeta } from "../../meta/[type]/[id].json.js";
import { imdb } from "../../catalog/[type]/[id]/search=[q].json.js";

/**
 * Gets stream data
 * @param {Object} context
 * @param {Object} env
 * @returns {Promise<Response>}
 */
async function GET(context) {
  const { request, env, params } = context;
  const { href } = new URL(request.url);
  const { videoID, type } = params;

  console.time(`GET ${ type }/${ videoID }`);

  const prefix = `${type}:${ videoID }:`;

  const {
    keys = [],
    list_complete,
    cursor,
  } = await env.STREAMS.list({
    prefix,
    limit: 1000, // default, max allowed
    cursor: "",
  });

  const streams = [];

  for (const { name: key, metadata } of keys) {
    const [ , , folderName ] = key.split(":");
    if (!folderName) {
      continue;
    }

    const {
      name: filename,
      size: videoSize = 0,
      type: mimetype = "video/webm",
    } = await env.STREAMS.get(key, { type: "json" });

    const { resolution, sources, videoCodec, edition } = filenameParse(filename.replace("H.26", "H26"));
    let name = `[StremFile] ${resolution} ${sources[0]}`;
    if (filename.includes("HDR") || edition.hdr) {
      name += " HDR";
    }
    if (filename.includes("DV") || edition.dolbyVision) {
      name += " DV";
    }
    if (videoCodec) {
      name += ` ${videoCodec}`;
    }

    streams.push({
      name,
      description: `${filename}\n${prettyBytes(videoSize)}`,
      url: href.replace(/\.json$/, `/${folderName}/${filename}`),
      behaviorHints: {
        // Set the stream to be a binge group so next episode will play automatically
        "bingeGroup": `StremFile-${resolution}`,
        // Set not to be web ready so it will send headers.
        "notWebReady": true,
        "proxyHeaders": {
          "request": {
            "Content-Type": mimetype,
          },
        },
      },
      videoSize,
      filename,
    });
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

  await env.STREAMS.put(`${ prefix }${ folder }`, JSON.stringify(file), {
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

function prettyBytes(size) {
  var i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  return +((size / Math.pow(1024, i)).toFixed(2)) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
}
