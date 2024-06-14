import { filenameParse } from "@ctrl/video-filename-parser";
import { onRequest as fetchStream } from "./[videoID]/[folderName]/[fileName].js";

/**
 * Gets stream data
 * @param {Object} context
 * @param {Object} env
 * @returns {Promise<Response>}
 */
async function GET(context) {
  const { request, env, params } = context;
  const { href } = new URL(request.url);
  let { videoID, type } = params;
  videoID = decodeURIComponent(videoID);

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

  for (const { name: key } of keys) {
    const [folderName ] = key.split(":").reverse();
    if (!folderName) {
      continue;
    }

    // Gets the file data from the KV. It can be partial or full.
    const file = await env.STREAMS.get(key, { type: "json" });
    // Fetches the stream data from the API
    params.folderName = folderName;
    params.fileName = file.name;

    const {
      name: filename,
      size: videoSize,
      type: mimetype = "video/webm",
      location,
    } = file;

    const {
      resolution,
      sources,
      videoCodec,
      edition,
    } = filenameParse(filename.replace("H.26", "H26"));

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
        bingeGroup: `StremFile-${resolution}`,
        // Set not to be web ready so it will send headers.
        notWebReady: true,
        proxyHeaders: {
          response: {
            "content-type": mimetype,
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

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "GET") {
    return GET(context);
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
