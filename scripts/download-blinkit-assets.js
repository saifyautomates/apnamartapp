const fs = require("fs");
const path = require("path");
const https = require("https");

const ASSETS = {
  // Hero Banners
  "banners/hero-groceries.jpg": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=85&fit=crop",
  "banners/pharmacy.jpg": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=85&fit=crop",
  "banners/pet-care.jpg": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&q=85&fit=crop",
  "banners/baby-care.jpg": "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=85&fit=crop",

  // Category Thumbnails (matching Blinkit's 2-row category rail!)
  "categories/paan-corner.jpg": "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=300&q=85&fit=crop",
  "categories/dairy-bread.jpg": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&q=85&fit=crop",
  "categories/fruits-vegetables.jpg": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=85&fit=crop",
  "categories/cold-drinks.jpg": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&q=85&fit=crop",
  "categories/snacks-munchies.jpg": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&q=85&fit=crop",
  "categories/breakfast-instant.jpg": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=300&q=85&fit=crop",
  "categories/sweet-tooth.jpg": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=300&q=85&fit=crop",
  "categories/bakery-biscuits.jpg": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&q=85&fit=crop",
  "categories/tea-coffee.jpg": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&q=85&fit=crop",
  "categories/atta-rice-dal.jpg": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=85&fit=crop",
  "categories/masala-oil.jpg": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=85&fit=crop",
  "categories/sauces-spreads.jpg": "https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=300&q=85&fit=crop",
  "categories/chicken-meat.jpg": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&q=85&fit=crop",
  "categories/organic-healthy.jpg": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=85&fit=crop",
  "categories/baby-care-cat.jpg": "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=85&fit=crop",
  "categories/pharma-wellness.jpg": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&q=85&fit=crop",
  "categories/cleaning-essentials.jpg": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&q=85&fit=crop",
  "categories/home-office.jpg": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&q=85&fit=crop",
  "categories/personal-care-cat.jpg": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&q=85&fit=crop",
  "categories/pet-care-cat.jpg": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=85&fit=crop",
};

const baseDir = path.join(__dirname, "..", "public", "images");

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
  for (const [relPath, url] of Object.entries(ASSETS)) {
    const dest = path.join(baseDir, relPath);
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    try {
      await download(url, dest);
      console.log(`[OK] ${relPath}`);
    } catch (e) {
      console.error(`[FAIL] ${relPath}: ${e.message}`);
    }
  }
}

run();

