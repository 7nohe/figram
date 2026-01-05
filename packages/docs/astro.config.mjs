import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  site: "https://figram.7nohe.dev",
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
              label: "Supported Icons",
              translations: { ja: "対応アイコン" },
              items: [
                {
                  label: "Overview",
                  translations: { ja: "概要" },
                  slug: "supported-icons",
                },
                {
                  label: "AWS Icons",
                  translations: { ja: "AWS アイコン" },
                  slug: "icons-aws",
                },
                {
                  label: "Azure Icons",
                  translations: { ja: "Azure アイコン" },
                  slug: "icons-azure",
                },
                {
                  label: "GCP Icons",
                  translations: { ja: "GCP アイコン" },
                  slug: "icons-gcp",
                },
              ],
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
            content: "https://figram.7nohe.dev/og-image.png",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "twitter:image",
            content: "https://figram.7nohe.dev/og-image.png",
          },
        },
      ],
    }),
  ],
});
