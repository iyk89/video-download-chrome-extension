import { execSync } from "child_process";
import fs from "fs";

try {
  if (!fs.existsSync("localhost.pem")) {
    console.log("🔧 Generating HTTPS certificates for localhost...");
    execSync("mkcert -install", { stdio: "inherit" });
    execSync("mkcert localhost", { stdio: "inherit" });
    console.log("✅ Certificates created: localhost.pem & localhost-key.pem");
  } else {
    console.log("✅ Certificates already exist.");
  }
} catch (err) {
  console.error("❌ Failed to generate certificates.");
  console.log("Please install mkcert manually:");
  console.log("1. brew install mkcert");
  console.log("2. mkcert -install");
  console.log("3. mkcert localhost");
  process.exit(1);
}
