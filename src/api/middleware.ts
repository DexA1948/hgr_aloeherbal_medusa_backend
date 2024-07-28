import type { MiddlewaresConfig } from "@medusajs/medusa"
import cors from "cors"

export const config: MiddlewaresConfig = {
  routes: [
    {
      matcher: "/store/esewa/verify",
      middlewares: [
        cors({
          origin: "http://localhost:8000",
          credentials: true,
        }),
      ],
    },
  ],
}