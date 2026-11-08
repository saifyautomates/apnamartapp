const fs = require("fs");
const path = require("path");

const pub = path.join(__dirname, "..", "public");
const icon512 = fs.readFileSync(path.join(pub, "icons", "icon-512.png"));
const b64 = icon512.toString("base64");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${b64}" width="512" height="512" />
</svg>
`;

fs.writeFileSync(path.join(pub, "favicon.svg"), svg);
console.log("Successfully generated public/favicon.svg embedding true transparent Central Mart logo! Size:", svg.length);

