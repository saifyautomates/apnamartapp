const http = require("http");

async function checkRedirectCookies() {
  // Let's check what headers are returned by /auth/callback
  const req = http.request(
    "http://localhost:3000/auth/callback",
    { method: "GET" },
    (res) => {
      console.log("Status:", res.statusCode);
      console.log("Set-Cookie headers on redirect:", res.headers["set-cookie"]);
      console.log("Location:", res.headers["location"]);
    }
  );
  req.end();
}

checkRedirectCookies();

