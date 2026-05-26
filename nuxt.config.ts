// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    host: "0.0.0.0",
    port: 3000,
    https: true,
  },
  css: ["@/assets/tailwind.css"],
  modules: [
    "@nuxtjs/tailwindcss",
    "shadcn-nuxt",
    "@pinia/nuxt",
    "nuxt-auth-utils",
  ],
  auth: {
    session: {
      maxAge: 60 * 60 * 24 * 7,
      cookie: {
        maxAge: 60 * 60 * 24 * 7, // 7 days — makes it a persistent cookie
        sameSite: "lax",
        secure: true, // use false in dev if not on HTTPS
        httpOnly: true,
      },
    },
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
