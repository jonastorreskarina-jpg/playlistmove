require("dotenv").config();

const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const session = require("express-session");

const app = express();

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
    "playlist-modify-private"
  ];

  const authorizeURL =
    spotifyApi.createAuthorizeURL(scopes);

  res.redirect(authorizeURL);

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

    const me =
      await spotifyApi.getMe();

    res.redirect("/playlists");

  } catch (err) {

    console.log(err);

    res.send("Error");

  }

});

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

    let html = `
      <h1>Mis Playlists</h1>
      <ul>
    `;

    data.body.items.forEach(p => {

      html += `
        <li>
          ${p.name}
          (${p.tracks.total} canciones)
        </li>
      `;

    });

    html += "</ul>";

    res.send(html);

  } catch (err) {

    console.log(err);

    res.send("Error cargando playlists");

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor iniciado en puerto " + PORT);
});