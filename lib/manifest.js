/**
 * @typedef {(
 *   'addon_catalog' |
 *   'catalog' |
 *   'meta' |
 *   'stream' |
 *   'subtitles'
 * )} Resource
 */

/**
 * @typedef {(
 *   'movie' |
 *   'series' |
 *   'channel' |
 *   'tv'
 * )} ContentType
 */

/**
 * @typedef {Object} Catalog
 * @property {ContentType} type - The content type of the catalog
 * @property {string} id - The id of the catalog, can be any unique
 *     string describing the catalog (unique per addon, as an addon can
 *     have many catalogs)
 * @property {string} name - Human readable name of the catalog
 * @property {Extra[]} extra - All extra properties related to this catalog
 * @property {string[]} [generes]
 * @property {Meta[]} metas
 * @property {string} [href]
 */

/**
 * @typedef {Object} Extra
 * @property {string} name - The name of the property; this name will
 *     be used in the `extraProps`
 * @property {Boolean} isRequired - Set to true if this property must
 *     always be passed
 * @property {string[]} [options] - Possible values for this property;
 *     this is useful for things like genres, where you need the user
 *     to select from a pre-set list of options
 * @property {number} [optionsLimit=1] - The limit of values a user may
 *     select from the options list
*/

/**
 * @typedef {Object} Meta
 * @property {string} id - Universal identifier; you may use a prefix
 *     unique to your addon, e.g. `yt_id:UCrDkAvwZum-UTjHmzDI2iIw`
 * @property {string} name - Name of the content
 * @property {string[]} [genres] - Genre/categories of the content;
 *     e.g. `["Thriller", "Horror"]`. (warning: this will soon be
 *     deprecated in favor of `links`)
 * @property {string} [poster] - URL to png of poster; accepted aspect
 *     ratios: 1:0.675 (IMDb poster type) or 1:1 (square); you can use
 *     any resolution, as long as the file size is below 100kb; below
 *     50kb is recommended
 * @property {'square'|'poster'|'landscape'} [posterShape=poster] - Can
 *     be square (1:1 aspect) or poster (1:0.675) or landscape (1:1.77)
 * @property {string} [background] - The background shown on the detail
 *     page; heavily encouraged if you want your content to look good;
 *     URL to PNG, max file size 500kb.
 * @property {string} [logo] - The logo shown on the detail page;
 *     encouraged if you want your content to look good; URL to PNG
 * @property {string} [description] - Few sentences describing your
 *     content
 * @property {string} [releaseInfo] - Year the content came out ; if
 *     it's `series` or `channel`, use a start and end years split by a
 *     tide - e.g. `"2000-2014"`. If it's still running, use a format
 *     like `"2000-"`
 * @property {string[]} [director] - Director names (warning: this will
 *     soon be deprecated in favor of `links`)
 * @property {string[]} [cast] - Cast names (warning: this will soon be
 *     deprecated in favor of `links`)
 * @property {string} [imdbRating] - IMDb rating, a number from 0.0 to
 *     10.0; use if applicable
 * @property {string} [released] - ISO 8601, initial release date; for
 *     movies, this is the cinema debut, e.g. "2010-12-06T05:00:00.000Z"
 * @property {Array<{
 *     source: string,
 *     type: "Trailer" | "Clip"}>
 * } [trailers] - Trailers. (warning: this will soon be deprecated in
 *     favor of meta.trailers being an array of Stream Objects)
 * @property {Link[]} [links]
 * @property {Video[]} [videos] - Used for `channel` and `series`; if
 *     you do not provide this (e.g. for `movie`), Stremio assumes this
 *     meta item has one video, whose ID is equal to the meta item `id`
 * @property {string} [runtime] - Human-readable expected runtime -
 *     e.g. "120m"
 * @property {string} [language] - Spoken language
 * @property {string} [country] - Official country of origin
 * @property {string} [awards] - Human-readable that describes all the
 *     significant awards
 * @property {string} [website] - URL to official website
 * @property {{defaultVideoId?: string}} [behaviorHints]
 */

/**
 * @typedef {Object} Link
 * @property {string} name - Human readable name for the link
 * @property {string} category - Any unique category name, links are
 *     grouped based on their category, some recommended categories
 *     are: `actor`, `director`, `writer`, while the following
 *     categories are reserved and should not be used: `imdb`, `share`,
 *     `similar`
 * @property {string} url - An external URL or {@linkcode MetaLink}
 */

/**
 * @typedef {(
 *     'stremio:///search?search=${query}' |
 *     'stremio:///discover/${transportUrl}/${type}/${catalogId}?${extra}' |
 *     'stremio:///detail/${type}/${id}' |
 *     'stremio:///detail/${type}/${id}/${videoId}'
 * )} MetaLink
 */

/**
 * @typedef {Object} Video
 * @property {string} id - ID of the video
 * @property {string} title - Title of the video
 * @property {string} released - ISO 8601, publish date of the video;
 *     for episodes, this should be the initial air date, e.g.
 *     `"2010-12-06T05:00:00.000Z"`
 * @property {string} [thumbnail] - URL to png of the video thumbnail,
 *     in the video's aspect ratio, max file size 5kb
 * @property {Stream[]} [streams] - In case you can return links to
 *     streams while forming meta response, you can pass and array of
 *     {@linkcode Stream} Objects to point the video to a HTTP URL,
 *     BitTorrent, YouTube or any other stremio-supported transport
 *     protocol; note that this is exclusive: passing `video.streams`
 *     means that Stremio will not request any streams from other addons
 *     for that video; if you return streams that way, it is still
 *     recommended to implement the streams resource
 * @property {boolean} [available] - Set to `true` to explicitly state
 *     that this video is available for streaming, from your addon; no
 *     need to use this if you've passed streams
 * @property {number} [episode] - Episode number, if applicable
 * @property {number} [season] - Season number, if applicable
 * @property {Stream[]} [trailers] - Trailers
 * @property {string} [overview] - Video overview/summary
 */

/**
 * @typedef {Object} Stream
 * @property {string} [url] - Direct URL to a video stream - must be an
 *     MP4 through https; others video formats over http/rtmp supported
 *     if you set `notWebReady`
 * @property {string} [ytId] - YouTube video ID, plays using the
 *     built-in YouTube player
 * @property {string} [infoHash] - Info hash of a torrent file
 * @property {number} [fileIdx] - The index of the video file within
 *     the torrent (from `infoHas`h); **if `fileIdx` is not specified,
 *     the largest file in the torrent will be selected**
 * @property {string | MetaLink | URL} [externalUrl] - External URL to
 *     the video, which should be opened in a browser (webpage), e.g.
 *     link to Netflix
 * @property {string} [name] - Name of the stream; usually used for
 *     stream quality
 * @property {string} [description] - Description of the stream
 *     (warning: this will soon be deprecated in favor of
 *     stream.description)
 * @property {Subtitle[]} [subtitles] - Subtitles for this stream
 * @property {{
 *   countryWhitelist?: string[],
 *   notWebReady?: boolean,
 *   bingeGroup?: string,
 *   proxyHeaders?: {
 *     request?: Object,
 *     response?: Object
 *   }
 * }} [behaviorHints]
 */

/**
 * @typedef {Object} Subtitle
 * @property {string} id - Unique identifier for each subtitle, if you
 *     have more than one subtitle with the same language, the id will
 *     differentiate them
 * @property {string} url - URL to the subtitle file
 * @property {string} lang - Language code for the subtitle, if a
 *     valid ISO 639-2 code is not sent, the text of this value will
 *     be used instead
 */

/**
 * @typedef {Object} Config
 * @property {string} name - A key that will identify the user chosen
 *     value
 * @property {string} type - Can be "text", "number", "password",
 *     "checkbox" or "select"
 * @property {string} [default] - The default value, for type:
 *     "boolean" this can be set to "checked" to default to enabled
 * @property {string} [title] - The title of the setting
 * @property {string[]} [options] - The list of (string) choices for
 *     type: "select"
 * @property {boolean} [required] - If the value is required or not,
 *     only applies to the following types: "string", "number"
 *     (default is `false`)
 */

class Manifest {
  /**
   * Identifier, dot-separated, e.g. "com.stremio.filmon"
   * @type {string}
   */
  id;
  /**
   * Human readable name
   * @type {string}
   */
  name;
  /**
   * Human readable description
   * @type {string}
   */
  description;
  /**
   * Semantic version of the addon
   * @type {string}
   */
  version;
  /**
   * Array of objects or strings, supported resources - for example
   * `["catalog", "meta", "stream", "subtitles", "addon_catalog"], resources
   * can also be added as objects instead of strings, for additional details
   * on how they should be requested, example: `
   * { "name": "stream", "types": [ "movie" ], "idPrefixes": [ "tt" ] }`
   * @type {Resource[]}
   */
  resources;
  /**
   * Supported types, from all the {@linkcode ContentTypes}
   * @type {ContentType[]}
   */
  types;
  /**
   * Use this if you want your addon to be called only for specific content IDs.
   * For example, if you set this to `["yt_id:", "tt"]`, your addon will only
   * be called for id values that start with `yt_id:` or `tt`
   * @type {[string]}
   */
  idPrefixes;
  /**
   * @type {Catalog[]}
   */
  catalogs;
  /**
   * Background image for the addon; URL to png/jpg, at least 1024x786.
   * @type {[string]}
   */
  background;
  /**
   * Logo icon, URL to png, monochrome, 256x256.
   * @type {[string]}
   */
  logo;
  /**
   * Contact email for addon issues; used for the Report button in the app;
   * also, the Stremio team may reach you on this email for anything relating
   * your addon.
   * @type {[string]}
   */
  contactEmail;
  behaviorHints = {
    /**
     * If the addon includes adult content, default is false; used to provide
     * an adequate warning to the user.
     */
    adult: false,
    /**
     * If the addon includes P2P content, such as BitTorrent, which may reveal
     * the user's IP to other streaming parties; used to provide an adequate
     * warning to the user.
     */
    p2p: false,
    /**
     * Default is false, if the addon supports settings, will add a button next
     * to "Install" in Stremio that will point to the /configure path on the
     * addon's domain.
     */
    configurable: false,
    /**
     * Default is false, if set to true the "Install" button will not show for
     * your addon in Stremio, instead a "Configure" button will show pointing
     * to the /configure path on the addon's domain.
     */
    configurationRequired: false,
  };

  /**
   * Fetches data from a manifest.json
   * @param {string} url URI of the manifest.json to fetch
   * @param {Object} [init]
   * @returns {Promise<Manifest>}
   */
  static async fetch(url, init = {}) {
    if (url != "/manifest.json") {
      const response = await fetch(url);
      return new Manifest(await response.json());
    }

    const { routes } = manifest;

    /**
     * @type {Resource[]}
     */
    const resources = [];
    /**
     * @type {ContentType[]}
     */
    const types = [];
    /**
     * @type {Catalog[]}
     */
    const catalogs = [];

    // Populates the manifest.
    Object.keys(routes).forEach((route) => {
      const [, , _configuration, resource, type, filename, extra] = route.split(
        "/",
      );

      // TODO: Adjust resources based on `configuration`.

      if (includes(Resources, resource)) {
        if (!includes(resources, resource)) {
          resources.push(resource);
        }
        if (!includes(ContentTypes, type)) {
          return;
        }

        if (!includes(types, type)) {
          types.push(type);
        }

        if (resource === "catalog") {
          const id = filename.substring(0, filename.indexOf(".json"));
          // @ts-ignore route can export a `name` property.
          const name = routes[route].name || id;

          if (extra) {
            let catalog = catalogs.find((catalog) => catalog.id === filename);
            if (!catalog) { // No actual catalog available.
              catalog = {
                id: filename,
                type,
                name,
                metas: [],
                extra: [],
              };
              catalogs.push(catalog);
            }

            const extras = catalog.extra;

            extras.push({
              name: extra.split("=", 1)[0],
              isRequired: false,
            });

            catalog.extra = extras;

            return;
          }

          catalogs.push({
            id,
            type,
            name,
            metas: [],
            extra: [],
          });
        }
      }
    });

    return new Manifest({
      ...init,
      resources,
      types,
      catalogs,
    });
  }

  /**
   *
   * @param {Manifest} [props]
   */
  constructor(props = {}) {
    Object.assign(this, props);
  }
}

export default Manifest;