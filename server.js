require("dotenv").config();

const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const session = require("express-session");

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "playlistmove",
  resave: false,
  saveUninitialized: false
}));

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

app.get("/", (req, res) => {

  res.send(`
  
  <h1>PlaylistMove</h1>

  <a href="/login">
    Conectar Spotify
  </a>

  `);

});

app.get("/login", (req, res) => {

  const scopes = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read"
];

  const authorizeURL =
    spotifyApi.createAuthorizeURL(scopes);

  res.redirect(authorizeURL);

});

app.get("/login-destination", (req, res) => {

  const scopes = [
    "playlist-read-private",
    "playlist-read-collaborative",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-library-read"
  ];

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri:
      process.env.SPOTIFY_REDIRECT_URI_DESTINATION,
    scope: scopes.join(" "),
    state: "destination"
  });

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
    params.toString()
  );

});

app.get("/callback", async (req, res) => {

  const code = req.query.code;

  try {

    const data =
      await spotifyApi.authorizationCodeGrant(code);

    spotifyApi.setAccessToken(
      data.body.access_token
    );

    spotifyApi.setRefreshToken(
      data.body.refresh_token
    );

    req.session.accessToken =
      data.body.access_token;

    req.session.refreshToken =
      data.body.refresh_token;

    res.redirect("/playlists");

  } catch (err) {

    console.log(err);

    res.send("Error");

  }

});

app.get(
  "/callback-destination",
  async (req, res) => {

    const code = req.query.code;

    try {

      const destinationApi =
  new SpotifyWebApi({
    clientId:
      process.env.SPOTIFY_CLIENT_ID,
    clientSecret:
      process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri:
      process.env.SPOTIFY_REDIRECT_URI_DESTINATION
  });

const data =
  await destinationApi.authorizationCodeGrant(
    code
  );

req.session.destinationAccessToken =
  data.body.access_token;

req.session.destinationRefreshToken =
  data.body.refresh_token;

destinationApi.setAccessToken(
  data.body.access_token
);

const me =
  await destinationApi.getMe();

req.session.destinationUserId =
  me.body.id;

res.send(`
  <h1>Cuenta destino conectada</h1>

  <p>
    Usuario: ${me.body.display_name}
  </p>

  <a href="/transfer">
    Iniciar transferencia
  </a>
`);

    } catch (err) {

      console.log(err);

      res.send(
        "Error conectando cuenta destino"
      );

    }

  }
);

app.get("/playlists", async (req, res) => {

  try {

    if (!req.session.accessToken) {
      return res.redirect("/");
    }

    spotifyApi.setAccessToken(
      req.session.accessToken
    );

    const data =
      await spotifyApi.getUserPlaylists();

      const likedSongs =
  await spotifyApi.getMySavedTracks({
    limit: 1
  });

    let html = `
  <h1>Mis Playlists</h1>

  <form action="/selected" method="post">

    <label>
      <input
        type="checkbox"
        name="playlist"
        value="liked"
      >
      ❤️ Canciones que te gustan
      (${likedSongs.body.total})
    </label>

    <br><br>

    <ul>
`;

    data.body.items.forEach(p => {

  html += `
    <li>
      <input
        type="checkbox"
        name="playlist"
        value="${p.id}"
      >
      ${p.name}
    </li>
  `;

});

    html += `
  </ul>

  <br>

  <button type="submit">
    Continuar
  </button>

  </form>
`;

    res.send(html);

  } catch (err) {

    console.log(err);

    res.send("Error cargando playlists");

  }

});

app.post("/selected", (req, res) => {

  req.session.selectedPlaylists =
    req.body.playlist;

  res.send(`
    <h1>Playlists seleccionadas</h1>

    <p>
      ${Array.isArray(req.body.playlist)
        ? req.body.playlist.length
        : 1}
      elementos seleccionados
    </p>

    <a href="/connect-destination">
      Conectar cuenta destino
    </a>
  `);

});

const PORT = process.env.PORT || 3000;
app.get("/connect-destination", (req, res) => {

  res.send(`
    <h1>Cuenta destino</h1>

    <p>
      Aquí conectaremos la segunda cuenta Spotify.
    </p>

    <a href="/login-destination">
      Conectar cuenta destino
    </a>
  `);

});


app.listen(PORT, () => {
  console.log("Servidor iniciado en puerto " + PORT);
});