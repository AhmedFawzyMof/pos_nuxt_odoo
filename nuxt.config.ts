// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["@/assets/tailwind.css"],
  modules: [
    "@nuxtjs/tailwindcss",
    "shadcn-nuxt",
    "@pinia/nuxt",
    "nuxt-auth-utils",
  ],
  auth: {
    maxAge: 60 * 60 * 24 * 7,
  },
  app: {
    head: {
      htmlAttrs: {
        dir: "rtl",
        lang: "ar",
        class: "light",
      },
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@100;200;300;400;500;600;700&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
        },
      ],
    },
  },
  shadcn: {
    /**
     * Prefix for all the imported component
     * @default "Ui"
     */
    prefix: "",
    /**
     * Directory that the component lives in.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: "@/components/ui",
  },
  pinia: {
    storesDirs: ["./stores/**"],
  },
});
