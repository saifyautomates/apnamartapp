const fs = require("fs");
const path = require("path");
const https = require("https");

const UNSPLASH_IMAGES = {
  "tata-salt-iodised": "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=500&q=85&fit=crop",
  "tata-salt-lite-low-sodium": "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=500&q=85&fit=crop",
  "india-gate-basmati-rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=85&fit=crop",
  "britannia-good-day-cashew-cookies": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=85&fit=crop",
  "haldirams-aloo-bhujia": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=85&fit=crop",
  "haldirams-moong-dal-namkeen": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=85&fit=crop",
  "tata-tea-gold": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=85&fit=crop",
  "brooke-bond-red-label-tea": "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=500&q=85&fit=crop",
  "real-mango-juice": "https://images.unsplash.com/photo-1546883444-245f8cb47854?w=500&q=85&fit=crop",
  "vim-dishwash-bar": "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&q=85&fit=crop",
  "nivea-body-lotion": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=85&fit=crop",
  "nutella-hazelnut-spread": "https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=500&q=85&fit=crop",
  "mdh-garam-masala": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=85&fit=crop",
  "everest-turmeric-powder": "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&q=85&fit=crop",
  "lijjat-papad": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=85&fit=crop",
  "dairy-milk-chocolate": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=85&fit=crop",
};

const targetDir = path.join(__dirname, "..", "public", "images", "products");

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
  const entries = Object.entries(UNSPLASH_IMAGES);
  console.log(`Downloading remaining ${entries.length} images...`);
  for (const [slug, url] of entries) {
    const dest = path.join(targetDir, `${slug}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`[SKIP] Already exists: ${slug}`);
      continue;
    }
    try {
      await download(url, dest);
      console.log(`[OK] ${slug}`);
    } catch (err) {
      console.error(`[FAIL] ${slug}: ${err.message}`);
    }
  }
}

run();

