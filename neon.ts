import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  functions: {
    dataapi: { name: "data-api", source: "./neon/functions/data-api.ts" },
    aichat: { name: "ai-chat", source: "./neon/functions/ai-chat.ts" },
  },
});
