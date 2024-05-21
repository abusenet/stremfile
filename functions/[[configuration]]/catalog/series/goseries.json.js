const catalog = {
  "metas": [
    {
      "type": "series",
      "id": "tt1748166",
      "name": "Pioneer One",
      "poster": "https://images.metahub.space/poster/medium/tt1748166/img",
      "genres": [
        "Drama",
        "Sci-Fi"
      ]
    },
    {
      "type": "series",
      "id": "hiwrld_tt0147753",
      "name": "Captain Z-Ro",
      "poster": "https://www.captain-z-ro.com/images/FLYER-PAGE-1_250.gif",
      "genres": [
        "Sci-Fi",
        "Children",
        "Educational"
      ]
    }
  ]
}

export function onRequest(context) {
  return new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};