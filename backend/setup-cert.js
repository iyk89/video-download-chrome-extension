// setup-cert.js
import { execSync } from "child_process";
import fs from "fs";

function checkMkcert() {
  try {
    execSync("mkcert -help", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function generateCerts() {
  if (!fs.existsSync("localhost.pem") || !fs.existsSync("localhost-key.pem")) {
    console.log("🔧 Generating new HTTPS certificates for localhost...");
    execSync("mkcert -install", { stdio: "inherit" });
    execSync("mkcert localhost", { stdio: "inherit" });
    console.log("✅ Certificates created: localhost.pem & localhost-key.pem");
  } else {
    console.log("✅ Certificates already exist.");
  }
}

if (!checkMkcert()) {
  console.log("❌ mkcert is not installed.");
  console.log("To install it on macOS, run:");
  console.log("  brew install mkcert nss");
  console.log("Then rerun: npm run setup-cert");
  process.exit(1);
}

generateCerts();
