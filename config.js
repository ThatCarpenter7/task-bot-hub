/**
 * Site configuration — fill these before going live.
 * Never commit a real API key. GitHub Pages is public static HTML.
 */
window.TASK_BOT_CONFIG = {
  /** Stripe Payment Link for the $0.99 USD unlock product */
  STRIPE_PAYMENT_LINK: "",

  /**
   * After Stripe checkout, send buyers here:
   *   https://YOUR_USERNAME.github.io/YOUR_REPO/success.html
   * success.html sets the unlock flag and redirects home.
   * You can also append ?paid=1 to the homepage URL in Stripe's success redirect.
   */
  SUCCESS_PATH: "success.html",

  /** Soft unlock for local demos only. Keep false in production. */
  DEMO_UNLOCK: false,

  /**
   * Optional AI endpoint (OpenAI-compatible / xAI Grok shape).
   * Example: "https://api.x.ai/v1/chat/completions"
   * Or your Cloudflare Worker proxy URL (recommended for production).
   */
  AI_ENDPOINT: "",

  /**
   * Leave empty on GitHub Pages. A public page cannot hide a key.
   * For production, put the real key only in a serverless proxy
   * (e.g. Cloudflare Worker secret) and point AI_ENDPOINT at that proxy.
   */
  AI_API_KEY: "",

  /** Model name when calling the chat completions API */
  AI_MODEL: "grok-4-fast",

  /**
   * Overseer — marketing/ops contact. Shown in the public fleet section.
   * Not a paid chatbot handoff option.
   */
  OVERSEER: {
    id: "3ed67bf6-5dba-4d77-9709-c204595ec6b8",
    name: "Overseer",
    blurb: "Efficiencies & revenue",
    url: "grokbot://app/v1/agent?id=3ed67bf6-5dba-4d77-9709-c204595ec6b8",
  },

  /** Four Task Bots available for paid chat handoff */
  TASK_BOTS: [
    {
      id: "1e68c0e4-7df0-48fa-900d-adea23650e12",
      name: "Task Bot 1",
      blurb: "General tasks & research",
      url: "grokbot://app/v1/agent?id=1e68c0e4-7df0-48fa-900d-adea23650e12",
    },
    {
      id: "a5edb3b1-8cbf-4347-ab76-5b3491ba55b3",
      name: "Task Bot 2",
      blurb: "Writing & drafts",
      url: "grokbot://app/v1/agent?id=a5edb3b1-8cbf-4347-ab76-5b3491ba55b3",
    },
    {
      id: "cd8f2009-198d-4173-b9aa-a965f64315b0",
      name: "Task Bot 3",
      blurb: "Planning & checklists",
      url: "grokbot://app/v1/agent?id=cd8f2009-198d-4173-b9aa-a965f64315b0",
    },
    {
      id: "526848c3-39a9-45b8-a4b2-2e4f6dd699c0",
      name: "Task Bot 4",
      blurb: "Creative & kids content",
      url: "grokbot://app/v1/agent?id=526848c3-39a9-45b8-a4b2-2e4f6dd699c0",
    },
  ],
};
