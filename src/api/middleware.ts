// File: aloeherbal-medusa-backend\src\api\middlewares.ts

import type { MiddlewaresConfig } from "@medusajs/medusa"
import cors from "cors"
import { json } from "body-parser"

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
    {
      matcher: "/store/job-application-send-email",
      // Disable the default body parser
      bodyParser: false,
      middlewares: [
        cors({
          origin: "http://localhost:8000",
          credentials: true,
        }),
        // Add custom body parser with increased limit
        json({
          limit: '10mb'
        })
      ],
    },
  ],
}