import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://figram.vercel.app",
  integrations: [
    starlight({
      title: {
        en: "figram",
        ja: "figram",
      },
      favicon: "/favicon.svg",
      description: "Define architecture diagrams as code and sync to FigJam in real time.",
      defaultLocale: "en",
      locales: {
        en: {
          label: "English",
        },
        ja: {
          label: "日本語",
          lang: "ja",
        },
      },
      social: {
        github: "https://github.com/7nohe/figram",
      },
      editLink: {
        baseUrl: "https://github.com/7nohe/figram/edit/main/packages/docs/",
      },
      sidebar: [
        {
          label: "Overview",
          translations: { ja: "概要" },
          slug: "index",
        },
        {
          label: "Getting Started",
          translations: { ja: "はじめに" },
          items: [
            {
              label: "Quick Start",
              translations: { ja: "クイックスタート" },
              slug: "quick-start",
            },
            {
              label: "Installation",
              translations: { ja: "インストール" },
              slug: "installation",
            },
          ],
        },
        {
          label: "Reference",
          translations: { ja: "リファレンス" },
          items: [
            {
              label: "YAML Specs",
              translations: { ja: "YAML 仕様" },
              slug: "yaml-specs",
            },
            {
              label: "Examples",
              translations: { ja: "サンプル集" },
              slug: "examples",
            },
          ],
        },
      ],
      customCss: ["./src/styles/custom.css"],
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://figram.vercel.app/og-image.png",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "twitter:image",
            content: "https://figram.vercel.app/og-image.png",
          },
        },
      ],
    }),
  ],
});
