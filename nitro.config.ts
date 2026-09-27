import { defineConfig } from "nitro";

export default defineConfig({
  plugins: ["src/plugins/newsletter-reconciliation.ts"],
});
