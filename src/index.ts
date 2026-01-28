import { serve } from "@hono/node-server";
import { setupServer } from "./server";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = process.env.HOST || "0.0.0.0";

const app = setupServer();

serve(
  {
    fetch: app.fetch,
    port: PORT,
    hostname: HOST,
  },
  () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  },
);
