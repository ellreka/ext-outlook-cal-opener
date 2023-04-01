const esbuild = require("esbuild");
const dotenv = require("dotenv");
dotenv.config();

esbuild
  .build({
    entryPoints: [
      "./src/background.ts",
      "./src/popup.tsx",
      "./src/options.tsx",
    ],
    bundle: true,
    minify: true,
    watch: process.argv.includes("--watch"),
    sourcemap: process.env.NODE_ENV !== "production",
    outdir: "./public/build",
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
      "process.env.CLIENT_ID": `"${process.env.CLIENT_ID}"`,
      "process.env.TENANT_ID": `"${process.env.TENANT_ID}"`,
    },
  })
  .catch(() => process.exit(1));
