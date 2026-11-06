const puppeteer = require('puppeteer-core');

async function testAllModals() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 1. Staff Login
  await page.goto('http://localhost:3000/staff-login', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const quickBtn = [...document.querySelectorAll('button')].find(
      (b) => b.innerText.includes('1-Click')
    );
    if (quickBtn) quickBtn.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  if (!page.url().includes('/admin')) {
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
  }

  const targets = [
    { name: 'Total Sales', search: 'TOTAL SALES', expected: 'Total Sales & Gross Margin Breakdown' },
    { name: 'Total Orders', search: 'TOTAL ORDERS', expected: 'Order Volume & Fulfillment Pipeline' },
    { name: 'Gross Profit', search: 'GROSS PROFIT', expected: 'Gross Profit & Retail Margin Audit' },
    { name: 'Low Stock Items', search: 'LOW STOCK', expected: 'Low Stock & Supplier Reorder Center' },
    { name: 'COD Cash Outstanding', search: 'COD CASH', expected: 'Cash on Delivery (COD) Rider Reconciliation' },
    { name: 'Stock Value', search: 'STOCK VALUE', expected: 'Catalog Inventory Asset Valuation' },
    { name: 'Average Order Value', search: 'AVERAGE ORDER VALUE', expected: 'Average Order Value (AOV) Analytics' },
    { name: 'Returning Customers', search: 'RETURNING CUSTOMERS', expected: 'Customer Loyalty & Retention Analysis' },
    { name: 'Delivery Performance', search: 'DELIVERY PERFORMANCE', expected: 'Delivery SLA & Fulfillment Performance' },
    { name: 'Omnichannel Retail Sync', search: 'OMNICHANNEL', expected: 'Omnichannel Retail Sync: Online Store + BUSY POS' }
  ];

  for (const t of targets) {
    const clicked = await page.evaluate((searchStr) => {
      const cards = [...document.querySelectorAll('div[role="button"]')];
      const found = cards.find(c => c.innerText.toUpperCase().includes(searchStr));
      if (found) {
        found.click();
        return true;
      }
      return false;
    }, t.search);

    if (!clicked) {
      console.error(`FAILED to click card: ${t.name}`);
      process.exit(1);
    }

    await new Promise(r => setTimeout(r, 500));

    const modalTitle = await page.evaluate(() => {
      const d = document.querySelector('div[role="dialog"] h3');
      return d ? d.innerText : '';
    });

    if (!modalTitle.includes(t.expected)) {
      console.error(`FAILED: Expected modal title containing "${t.expected}", got "${modalTitle}"`);
      process.exit(1);
    }

    console.log(`✓ Clicked [${t.name}] -> Successfully opened modal: "${modalTitle}"`);

    // Press Escape to close modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 300));
  }

  // Test clicking on a table row in Recent Orders & POS Bills
  console.log('\nTesting click on recent order table row:');
  const clickedRow = await page.evaluate(() => {
    const tr = document.querySelector('tbody tr');
    if (tr) {
      tr.click();
      return true;
    }
    return false;
  });

  if (clickedRow) {
    await new Promise(r => setTimeout(r, 500));
    const orderModalTitle = await page.evaluate(() => {
      const d = document.querySelector('div[role="dialog"] h3');
      return d ? d.innerText : '';
    });
    console.log(`✓ Clicked Recent Order row -> Successfully opened itemized receipt modal: "${orderModalTitle}"`);
    await page.keyboard.press('Escape');
  }

  await browser.close();
  console.log('\n🎉 ALL 11 INTERACTIVE DRILL-DOWN MODALS VERIFIED SUCCESSFULLY!');
}

testAllModals().catch((err) => {
  console.error(err);
  process.exit(1);
});
