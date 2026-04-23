import { Router, Request, Response } from "express";
import { env } from "../config/env.js";
import {
  verifyWebhookSignature,
  handleVidbloqWebhook,
} from "../services/webhook.service.js";
import type { VidbloqWebhookEvent } from "../services/webhook.service.js";

const router = Router();

// POST /api/webhooks/vidbloq — receive forwarded events from Vidbloq
router.post("/vidbloq", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-vidbloq-signature"] as string;
    const timestamp = req.headers["x-vidbloq-timestamp"] as string;

    if (!signature || !timestamp) {
      return res.status(401).json({ error: "Missing webhook signature" });
    }

    // Verify signature using the raw body (not re-serialized)
    // The raw body is captured by express.json({ verify }) in index.ts
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const isValid = verifyWebhookSignature(
      rawBody,
      signature,
      env().VIDBLOQ_WEBHOOK_SECRET!
    );

    if (!isValid) {
      console.error("[WEBHOOK] Invalid signature");
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    // Check timestamp freshness (reject events older than 5 minutes)
    const eventAge = Date.now() - parseInt(timestamp);
    if (eventAge > 5 * 60 * 1000) {
      console.warn("[WEBHOOK] Stale event, age:", eventAge, "ms");
      return res.status(400).json({ error: "Webhook event too old" });
    }

    // Acknowledge immediately
    res.status(200).json({ received: true });

    // Process async
    const event: VidbloqWebhookEvent = req.body;
    handleVidbloqWebhook(event).catch((err) => {
      console.error("[WEBHOOK] Processing error:", err);
    });
  } catch (err: any) {
    console.error("[WEBHOOK] Error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  }
});

export default router;