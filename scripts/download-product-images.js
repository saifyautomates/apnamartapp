const fs = require("fs");
const path = require("path");
const https = require("https");

const IMAGES = {
  "amul-taaza-toned-milk": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/19512a.jpg",
  "amul-gold-full-cream-milk": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/160a.jpg",
  "amul-butter": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/168a.jpg",
  "amul-ghee": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/148a.jpg",
  "amul-cheese-slices": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/171a.jpg",
  "amul-fresh-cream": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/184a.jpg",
  "mother-dairy-curd": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/196a.jpg",
  "aashirvaad-shudh-chakki-atta": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/240092a.jpg",
  "tata-salt-iodised": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/16288a.jpg",
  "tata-salt-lite-low-sodium": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/127118a.jpg",
  "fortune-sunflower-oil": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/24194a.jpg",
  "fortune-soya-health-oil": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/15298a.jpg",
  "india-gate-basmati-rice": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/384a.jpg",
  "toor-dal-unpolished": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/19500a.jpg",
  "moong-dal-yellow": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/19503a.jpg",
  "maggi-2-minute-noodles": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/757a.jpg",
  "parle-g-glucose-biscuits": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/872a.jpg",
  "britannia-good-day-cashew-cookies": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/886a.jpg",
  "britannia-marie-gold": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/887a.jpg",
  "haldirams-aloo-bhujia": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/1484a.jpg",
  "haldirams-moong-dal-namkeen": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/1486a.jpg",
  "coca-cola-soft-drink": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/348a.jpg",
  "pepsi-soft-drink": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/349a.jpg",
  "tata-tea-gold": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/477a.jpg",
  "brooke-bond-red-label-tea": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/480a.jpg",
  "nescafe-classic-coffee": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/514a.jpg",
  "real-mango-juice": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/368a.jpg",
  "surf-excel-easy-wash-detergent-powder": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3638a.jpg",
  "vim-dishwash-bar": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3655a.jpg",
  "harpic-toilet-cleaner": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3672a.jpg",
  "colgate-strong-teeth-toothpaste": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3860a.jpg",
  "dabur-red-paste": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3867a.jpg",
  "clinic-plus-shampoo": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3890a.jpg",
  "nivea-body-lotion": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/3940a.jpg",
  "kelloggs-corn-flakes": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/603a.jpg",
  "nutella-hazelnut-spread": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/620a.jpg",
  "mdh-garam-masala": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23118a.jpg",
  "everest-turmeric-powder": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23125a.jpg",
  "lijjat-papad": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/23160a.jpg",
  "dairy-milk-chocolate": "https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/app/images/products/sliding_image/1050a.jpg",
};

const targetDir = path.join(__dirname, "..", "public", "images", "products");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

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
  const entries = Object.entries(IMAGES);
  console.log(`Downloading ${entries.length} real product images...`);
  let ok = 0;
  for (const [slug, url] of entries) {
    const dest = path.join(targetDir, `${slug}.jpg`);
    try {
      await download(url, dest);
      console.log(`[OK] ${slug}`);
      ok++;
    } catch (err) {
      console.error(`[FAIL] ${slug}: ${err.message}`);
    }
  }
  console.log(`Finished: ${ok}/${entries.length} images downloaded.`);
}

run();

