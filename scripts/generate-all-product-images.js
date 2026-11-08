const fs = require('fs');
const path = require('path');

const PRODUCTS_DIR = path.join(process.cwd(), 'public/images/products');
const CATEGORIES_DIR = path.join(process.cwd(), 'public/images/categories');

if (!fs.existsSync(PRODUCTS_DIR)) fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

// Read FMCG items
const catalogText = fs.readFileSync(path.join(process.cwd(), 'src/lib/fmcg-catalog.ts'), 'utf8');

// Regex to extract items: name, brand, sub
const itemRegex = /{\s*name:\s*"([^"]+)",\s*brand:\s*"([^"]+)"(?:,\s*sub:\s*"([^"]+)")?/g;
let match;
const products = [];

while ((match = itemRegex.exec(catalogText)) !== null) {
  products.push({
    name: match[1],
    brand: match[2],
    sub: match[3] || '',
    slug: match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  });
}

console.log(`Discovered ${products.length} FMCG products in catalogue.`);

// Best image sources mapping by keywords/brands
function getBestSourceImage(name, brand, sub, slug) {
  const n = name.toLowerCase();
  const b = brand.toLowerCase();
  const s = sub.toLowerCase();

  // 1. Specific product matches
  if (n.includes('butter') || n.includes('makhan')) return path.join(PRODUCTS_DIR, 'amul-butter.jpg');
  if (n.includes('ghee')) return path.join(PRODUCTS_DIR, 'amul-ghee.jpg');
  if (n.includes('paneer') || n.includes('cheese')) {
    if (n.includes('slice')) return path.join(PRODUCTS_DIR, 'amul-cheese-slices.jpg');
    return path.join(PRODUCTS_DIR, 'amul-fresh-cream.jpg');
  }
  if (n.includes('bread') || n.includes('bun') || n.includes('pav')) {
    return path.join(CATEGORIES_DIR, 'bakery-biscuits.jpg');
  }
  if (n.includes('egg') || n.includes('ande')) {
    return path.join(CATEGORIES_DIR, 'dairy-eggs.jpg');
  }
  if (n.includes('curd') || n.includes('dahi') || n.includes('yogurt')) {
    return path.join(PRODUCTS_DIR, 'mother-dairy-curd.jpg');
  }
  if (n.includes('milk') || n.includes('doodh')) {
    if (n.includes('gold') || n.includes('cream')) return path.join(PRODUCTS_DIR, 'amul-gold-full-cream-milk.jpg');
    return path.join(PRODUCTS_DIR, 'amul-taaza-toned-milk.jpg');
  }
  if (n.includes('atta') || n.includes('flour') || n.includes('maida') || n.includes('suji')) {
    return path.join(PRODUCTS_DIR, 'aashirvaad-shudh-chakki-atta.jpg');
  }
  if (n.includes('rice') || n.includes('chawal') || n.includes('poha')) {
    return path.join(PRODUCTS_DIR, 'india-gate-basmati-rice.jpg');
  }
  if (n.includes('salt') || n.includes('namak')) {
    if (n.includes('lite') || n.includes('low sodium')) return path.join(PRODUCTS_DIR, 'tata-salt-lite-low-sodium.jpg');
    return path.join(PRODUCTS_DIR, 'tata-salt-iodised.jpg');
  }
  if (n.includes('sugar') || n.includes('cheeni') || n.includes('jaggery')) {
    return path.join(CATEGORIES_DIR, 'atta-rice-dal.jpg');
  }
  if (n.includes('oil') || n.includes('tel')) {
    if (n.includes('soya')) return path.join(PRODUCTS_DIR, 'fortune-soya-health-oil.jpg');
    return path.join(PRODUCTS_DIR, 'fortune-sunflower-oil.jpg');
  }
  if (n.includes('toor dal') || n.includes('arhar')) return path.join(PRODUCTS_DIR, 'toor-dal-unpolished.jpg');
  if (n.includes('moong dal')) return path.join(PRODUCTS_DIR, 'moong-dal-yellow.jpg');
  if (n.includes('dal') || n.includes('chana') || n.includes('rajma') || n.includes('pulses')) {
    return path.join(PRODUCTS_DIR, 'toor-dal-unpolished.jpg');
  }
  if (n.includes('turmeric') || n.includes('haldi')) return path.join(PRODUCTS_DIR, 'everest-turmeric-powder.jpg');
  if (n.includes('garam masala') || n.includes('masala') || n.includes('mirch') || n.includes('spice')) {
    return path.join(PRODUCTS_DIR, 'mdh-garam-masala.jpg');
  }
  if (n.includes('lay') || n.includes('chips') || n.includes('nachos') || n.includes('wafer')) {
    return path.join(CATEGORIES_DIR, 'snacks-munchies.jpg');
  }
  if (n.includes('bhujia') || n.includes('sev') || n.includes('namkeen') || n.includes('khatta meetha')) {
    return path.join(PRODUCTS_DIR, 'haldirams-aloo-bhujia.jpg');
  }
  if (n.includes('maggi') || n.includes('noodle') || n.includes('pasta') || n.includes('macaroni')) {
    return path.join(PRODUCTS_DIR, 'maggi-2-minute-noodles.jpg');
  }
  if (n.includes('coke') || n.includes('coca') || n.includes('thums up') || n.includes('pepsi') || n.includes('sprite') || n.includes('drink')) {
    if (n.includes('pepsi')) return path.join(PRODUCTS_DIR, 'pepsi-soft-drink.jpg');
    return path.join(PRODUCTS_DIR, 'coca-cola-soft-drink.jpg');
  }
  if (n.includes('juice') || n.includes('mango') || n.includes('real')) {
    return path.join(PRODUCTS_DIR, 'real-mango-juice.jpg');
  }
  if (n.includes('tea') || n.includes('chai')) {
    if (n.includes('gold')) return path.join(PRODUCTS_DIR, 'tata-tea-gold.jpg');
    return path.join(PRODUCTS_DIR, 'brooke-bond-red-label-tea.jpg');
  }
  if (n.includes('coffee') || n.includes('nescafe') || n.includes('bru')) {
    return path.join(PRODUCTS_DIR, 'nescafe-classic-coffee.jpg');
  }
  if (n.includes('corn flakes') || n.includes('cereal') || n.includes('oats') || n.includes('muesli')) {
    return path.join(PRODUCTS_DIR, 'kelloggs-corn-flakes.jpg');
  }
  if (n.includes('chocolate') || n.includes('dairy milk') || n.includes('kitkat') || n.includes('munch')) {
    return path.join(PRODUCTS_DIR, 'dairy-milk-chocolate.jpg');
  }
  if (n.includes('nutella') || n.includes('spread') || n.includes('peanut butter') || n.includes('jam')) {
    return path.join(PRODUCTS_DIR, 'nutella-hazelnut-spread.jpg');
  }
  if (n.includes('marie') || n.includes('britannia')) return path.join(PRODUCTS_DIR, 'britannia-marie-gold.jpg');
  if (n.includes('parle') || n.includes('glucose')) return path.join(PRODUCTS_DIR, 'parle-g-glucose-biscuits.jpg');
  if (n.includes('biscuit') || n.includes('cookie') || n.includes('oreo') || n.includes('dark fantasy')) {
    return path.join(PRODUCTS_DIR, 'britannia-good-day-cashew-cookies.jpg');
  }
  if (n.includes('surf') || n.includes('detergent') || n.includes('ariel') || n.includes('tide') || n.includes('rin')) {
    return path.join(PRODUCTS_DIR, 'surf-excel-easy-wash-detergent-powder.jpg');
  }
  if (n.includes('harpic') || n.includes('toilet') || n.includes('lizol') || n.includes('cleaner') || n.includes('colin')) {
    return path.join(PRODUCTS_DIR, 'harpic-toilet-cleaner.jpg');
  }
  if (n.includes('vim') || n.includes('dishwash') || n.includes('bar') || n.includes('pril')) {
    return path.join(PRODUCTS_DIR, 'vim-dishwash-bar.jpg');
  }
  if (n.includes('soap') || n.includes('dettol') || n.includes('dove') || n.includes('lifebuoy')) {
    return path.join(CATEGORIES_DIR, 'personal-care.jpg');
  }
  if (n.includes('shampoo') || n.includes('head & shoulders') || n.includes('pantene') || n.includes('sunsilk')) {
    return path.join(PRODUCTS_DIR, 'clinic-plus-shampoo.jpg');
  }
  if (n.includes('toothpaste') || n.includes('colgate') || n.includes('dabur') || n.includes('closeup') || n.includes('paste')) {
    if (n.includes('dabur')) return path.join(PRODUCTS_DIR, 'dabur-red-paste.jpg');
    return path.join(PRODUCTS_DIR, 'colgate-strong-teeth-toothpaste.jpg');
  }
  if (n.includes('nivea') || n.includes('lotion') || n.includes('cream') || n.includes('moisturizer')) {
    return path.join(PRODUCTS_DIR, 'nivea-body-lotion.jpg');
  }
  if (n.includes('diaper') || n.includes('pampers') || n.includes('huggies') || n.includes('baby')) {
    return path.join(CATEGORIES_DIR, 'baby-care-cat.jpg');
  }
  if (n.includes('pain') || n.includes('moov') || n.includes('volini') || n.includes('vicks') || n.includes('eno') || n.includes('band-aid')) {
    return path.join(CATEGORIES_DIR, 'pharma-wellness.jpg');
  }
  if (n.includes('dog') || n.includes('cat') || n.includes('pedigree') || n.includes('whiskas') || n.includes('pet')) {
    return path.join(CATEGORIES_DIR, 'pet-care-cat.jpg');
  }

  // Fallback to Category image if available
  const catFallback = path.join(CATEGORIES_DIR, `${s || 'staples'}.jpg`);
  if (fs.existsSync(catFallback)) return catFallback;

  return path.join(PRODUCTS_DIR, 'aashirvaad-shudh-chakki-atta.jpg');
}

let generated = 0;
let existing = 0;

for (const p of products) {
  const destPath = path.join(PRODUCTS_DIR, `${p.slug}.jpg`);
  if (fs.existsSync(destPath)) {
    existing++;
    continue;
  }

  const srcPath = getBestSourceImage(p.name, p.brand, p.sub, p.slug);
  if (srcPath && fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    generated++;
  } else {
    console.warn(`Could not find source image for: ${p.name}`);
  }
}

console.log(`Done! Existing: ${existing}, Newly Generated: ${generated}, Total: ${existing + generated}`);
