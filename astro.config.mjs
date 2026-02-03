// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://beorwl.github.io',
  // Project site deployment: https://beorwl.github.io/website/
  base: '/website',
  output: 'static',
  integrations: [tailwind()]
});