const assert = require("assert");

const BASE = "http://localhost:3000";

async function run() {
  console.log("=== STARTING LOGO & BRANDING PROPAGATION TEST ===");

  // 1. Fetch CSRF Token
  console.log("Step 1: Fetching initial CSRF token...");
  const csrfInitRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfInitJson = await csrfInitRes.json();
  const csrfToken = csrfInitJson.data?.csrfToken;
  assert.ok(csrfToken, "Must receive CSRF token");
  console.log("✓ Got CSRF token");

  // 2. Log in as admin (jackx)
  console.log("Step 2: Authenticating as Admin...");
  const loginRes = await fetch(`${BASE}/api/auth/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify({
      username: "jackx",
      password: "AdminPassword123!",
    }),
  });

  const loginJson = await loginRes.json();
  assert.strictEqual(loginRes.status, 200, `Login failed: ${JSON.stringify(loginJson)}`);
  assert.ok(loginJson.data?.admin?.roles.includes("OWNER"), "Should have OWNER role");
  console.log("✓ Admin logged in successfully!");

  const cookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get("set-cookie") || ""];
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");
  assert.ok(cookieHeader.includes("gcp_access="), "Must return gcp_access cookie");
  const adminCookie = cookieHeader;

  // 3. Fetch initial settings
  console.log("Step 3: Fetching initial settings...");
  const getSettingsRes = await fetch(`${BASE}/api/admin/settings`, {
    headers: { Cookie: adminCookie },
  });
  const getSettingsJson = await getSettingsRes.json();
  assert.strictEqual(getSettingsRes.status, 200);
  const initialStore = getSettingsJson.data?.store || {};
  console.log("✓ Current Store settings:", {
    name: initialStore.name,
    logoUrl: initialStore.logoUrl,
    appIconUrl: initialStore.appIconUrl,
  });

  // 4. Test Branding Asset Upload API
  console.log("Step 4: Testing /api/uploads endpoint for branding asset...");
  // Create a minimal 1x1 PNG
  const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const pngBuffer = Buffer.from(pngBase64, "base64");
  
  const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
  const pre = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\nlogos\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test-logo.png"\r\nContent-Type: image/png\r\n\r\n`
  );
  const post = Buffer.from(`\r\n--${boundary}--\r\n`);
  const multipartBody = Buffer.concat([pre, pngBuffer, post]);

  const uploadRes = await fetch(`${BASE}/api/uploads`, {
    method: "POST",
    headers: {
      Cookie: adminCookie,
      "x-csrf-token": csrfToken,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  const uploadJson = await uploadRes.json();
  assert.strictEqual(uploadRes.status, 200, `Upload failed: ${JSON.stringify(uploadJson)}`);
  assert.ok(uploadJson.data?.url, "Should return uploaded file URL");
  const uploadedLogoUrl = uploadJson.data.url;
  console.log("✓ Asset uploaded successfully! URL:", uploadedLogoUrl);

  // 5. Update Store Settings with new Logo & App Icon
  console.log("Step 5: Updating Logo & App Icon in Admin Settings...");
  const testLogoUrl = uploadedLogoUrl;
  const testAppIconUrl = "/uploads/test-icon.png";
  const testStoreName = "Central Mart Kota Prime";

  const putRes = await fetch(`${BASE}/api/admin/settings`, {
    method: "PUT",
    headers: {
      Cookie: adminCookie,
      "x-csrf-token": csrfToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      store: {
        ...initialStore,
        name: testStoreName,
        logoUrl: testLogoUrl,
        appIconUrl: testAppIconUrl,
        displayMode: "IMAGE_ONLY",
      },
    }),
  });

  const putJson = await putRes.json();
  assert.strictEqual(putRes.status, 200, `PUT settings failed: ${JSON.stringify(putJson)}`);
  assert.strictEqual(putJson.data?.store?.logoUrl, testLogoUrl);
  assert.strictEqual(putJson.data?.store?.appIconUrl, testAppIconUrl);
  assert.strictEqual(putJson.data?.store?.name, testStoreName);
  console.log("✓ Settings saved and verified in DB response!");

  // 6. Verify Dynamic Web Manifest reflects the new App Icon and Name
  console.log("Step 6: Verifying dynamic /manifest.webmanifest route...");
  const manifestRes = await fetch(`${BASE}/manifest.webmanifest`, {
    headers: { "Cache-Control": "no-cache" },
  });
  assert.strictEqual(manifestRes.status, 200);
  const manifest = await manifestRes.json();
  console.log("✓ Fetched manifest name:", manifest.name);
  console.log("✓ Fetched manifest short_name:", manifest.short_name);
  assert.ok(manifest.name.includes("Central Mart Kota Prime"), "Manifest name must reflect updated store name");
  assert.strictEqual(manifest.short_name, "Central Mart Kota Prime", "Manifest short_name must reflect updated store name");
  
  const iconSrcs = manifest.icons.map((i) => i.src);
  assert.ok(iconSrcs.includes(testAppIconUrl), `Manifest must include custom appIconUrl: ${iconSrcs.join(", ")}`);
  console.log("✓ Manifest correctly includes custom appIconUrl and updated store name!");

  // 7. Verify dynamic /manifest.json route
  console.log("Step 7: Verifying dynamic /manifest.json route...");
  const jsonManifestRes = await fetch(`${BASE}/manifest.json`, {
    headers: { "Cache-Control": "no-cache" },
  });
  assert.strictEqual(jsonManifestRes.status, 200);
  const jsonManifest = await jsonManifestRes.json();
  assert.ok(jsonManifest.name.includes("Central Mart Kota Prime"));
  console.log("✓ /manifest.json correctly serves the updated branding!");

  // 8. Verify Storefront HTML SSR output
  console.log("Step 8: Verifying Storefront HTML SSR output on / ...");
  const homeRes = await fetch(`${BASE}/`);
  assert.strictEqual(homeRes.status, 200);
  const html = await homeRes.text();
  assert.ok(html.includes(testLogoUrl) || html.includes("Central Mart Kota Prime"), "Home page SSR must contain updated logo or store name");
  console.log("✓ Storefront homepage reflects the new branding on SSR!");

  // 9. Revert cleanly to default
  console.log("Step 9: Cleaning up / reverting to default Central Mart...");
  const revertRes = await fetch(`${BASE}/api/admin/settings`, {
    method: "PUT",
    headers: {
      Cookie: adminCookie,
      "x-csrf-token": csrfToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      store: {
        ...initialStore,
        name: "Central Mart",
        logoUrl: "",
        appIconUrl: "",
        displayMode: "IMAGE_ONLY",
      },
    }),
  });
  const revertJson = await revertRes.json();
  assert.strictEqual(revertRes.status, 200);
  assert.strictEqual(revertJson.data?.store?.logoUrl, "");
  assert.strictEqual(revertJson.data?.store?.name, "Central Mart");
  console.log("✓ Successfully reverted to default!");

  console.log("\n========================================================");
  console.log("🎉 ALL LOGO & BRANDING PROPAGATION TESTS PASSED 100%!");
  console.log("========================================================\n");
}

run().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
