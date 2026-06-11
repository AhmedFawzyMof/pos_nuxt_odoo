export default {
  apps: [
    {
      name: "nuxt-pos",
      script: "./.output/server/index.mjs",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3080,
        HOST: "0.0.0.0",
        DEFAULT_URL: process.env.DEFAULT_URL,
        DEFAULT_DB: process.env.DEFAULT_DB,
        NUXT_SESSION_PASSWORD: process.env.NUXT_SESSION_PASSWORD,
        NUXT_SESSION_MAX_AGE: process.env.NUXT_SESSION_MAX_AGE,
      },
    },
  ],
}
