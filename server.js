import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadData } from "./src/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, "data");
const port = process.env.PORT || 3000;

let data;
try {
  data = loadData(dataDir);
} catch (err) {
  console.error(`Failed to start: ${err.message}`);
  process.exit(1);
}

const { createApp } = await import("./src/app.js");
const app = createApp({
  cookies: data.cookies,
  bundles: data.bundles,
  shop: data.shop,
});

app.listen(port, () => {
  console.log(`Cookie shop site listening on port ${port}`);
});
