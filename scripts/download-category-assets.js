const fs = require("fs");
const path = require("path");
const https = require("https");

const CATEGORY_IMAGES = {
  "dairy-eggs": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=80&fit=crop",
  "staples": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80&fit=crop",
  "snacks": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=80&fit=crop",
  "beverages": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=80&fit=crop",
  "household": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=80&fit=crop",
  "personal-care": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=80&fit=crop",
  "breakfast": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=80&fit=crop",
};

const BANNER_IMAGES = {
  "banner-10mins": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=85&fit=crop",
  "banner-dairy": "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=1200&q=85&fit=crop",
  "banner-snacks": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=1200&q=85&fit=crop",
};

const catDir = path.join(__dirname, "..", "public", "images", "categories");
const banDir = path.join(__dirname, "..", "public", "images", "banners");
fs.mkdirSync(catDir, { recursive: true });
fs.mkdirSync(banDir, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => resolve(true));
      });
    }).on("error", reject);
  });
}

async function run() {
  for (const [slug, url] of Object.entries(CATEGORY_IMAGES)) {
    try {
      await download(url, path.join(catDir, `${slug}.jpg`));
      console.log("Cat OK:", slug);
    } catch (e) {
      console.error("Cat FAIL:", slug, e.message);
    }
  }
  for (const [slug, url] of Object.entries(BANNER_IMAGES)) {
    try {
      await download(url, path.join(banDir, `${slug}.jpg`));
      console.log("Banner OK:", slug);
    } catch (e) {
      console.error("Banner FAIL:", slug, e.message);
    }
  }
}

run();

