import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr"; // if you use SVG import as ReactComponent

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            "@locator/babel-jsx/dist",
            {
              env: "development", // only active in dev
            },
          ],
        ],
      },
    }),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
});
