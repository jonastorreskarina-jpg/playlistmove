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

    const me =
      await spotifyApi.getMe();

    res.send(`
    
    <h2>Conectado correctamente</h2>

    Usuario:
    ${me.body.display_name}
    
    `);

  } catch (err) {

    console.log(err);

    res.send("Error");

  }

});

app.listen(3000, () => {

  console.log(
    "Servidor iniciado en puerto 3000"
  );

});