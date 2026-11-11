const { signAccess, signRefresh } = require("./src/lib/auth");

console.log("Checking auth sign functions...");
try {
  const access = signAccess({ kind: "CUSTOMER", userId: "test-user-id" });
  console.log("Access token signed:", access ? "OK" : "FAILED");
} catch (e) {
  console.error("Error signing access token:", e.message);
}

