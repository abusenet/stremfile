const catalog = {
  "metas": [
    {
      "type": "movie",
      "id": "tt0032138",
      "name": "The Wizard of Oz",
      "poster": "https://images.metahub.space/poster/medium/tt0032138/img",
      "genres": [
        "Adventure",
        "Family",
        "Fantasy",
        "Musical"
      ]
    },
    {
      "type": "movie",
      "id": "tt0017136",
      "name": "Metropolis",
      "poster": "https://images.metahub.space/poster/medium/tt0017136/img",
      "genres": [
        "Drama",
        "Sci-Fi"
      ]
    },
    {
      "type": "movie",
      "id": "tt1254207",
      "name": "Big Buck Bunny",
      "poster": "https://images.metahub.space/poster/medium/tt1254207/img",
      "genres": [
        "Animation",
        "Short",
        "Comedy"
      ]
    },
    {
      "type": "movie",
      "id": "tt0807840",
      "name": "Elephants Dream",
      "poster": "https://images.metahub.space/poster/medium/tt0807840/img",
      "genres": [
        "Animation",
        "Short",
        "Sci-Fi"
      ]
    },
    {
      "type": "movie",
      "id": "tt1727587",
      "name": "Sintel",
      "poster": "https://images.metahub.space/poster/medium/tt1727587/img",
      "genres": [
        "Animation",
        "Short",
        "Fantasy"
      ]
    },
    {
      "type": "movie",
      "id": "tt2285752",
      "name": "Tears of Steel",
      "poster": "https://images.metahub.space/poster/medium/tt2285752/img",
      "genres": [
        "Short",
        "Sci-Fi"
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