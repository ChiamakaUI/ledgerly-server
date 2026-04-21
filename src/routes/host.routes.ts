import { Router, Request, Response } from "express";
import {
  createHostRecord,
  getHostBySlugRecord,
  getHostByWalletRecord,
  updateHostRecord,
  getHostAvailabilityRules,
  setHostAvailabilityRules,
  setHostDateOverrides,
  getAvailableSlots
} from "../services/index.js";


const router = Router();

// ============================================
// Static routes first (before /:slug)
// ============================================

// POST /api/hosts — register
router.post("/", async (req: Request, res: Response) => {
  try {
    const host = await createHostRecord(req.body);
    return res.status(201).json({ host });
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Wallet or slug already registered" });
    }
    console.error("Error creating host:", err);
    return res.status(500).json({ error: "Failed to create host" });
  }
});

// GET /api/hosts/me — get current host profile + availability
router.get("/me", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) {
      return res.status(401).json({ error: "Wallet address required" });
    }
 
    const host = await getHostByWalletRecord(walletAddress);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }
 
    const availability = await getHostAvailabilityRules(host.id);
    return res.json({ host, availability });
  } catch (err: any) {
    console.error("Error fetching host profile:", err);
    return res.status(500).json({ error: "Failed to fetch host profile" });
  }
});

// PUT /api/hosts/me — update profile
router.put("/me", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) {
      return res.status(401).json({ error: "Wallet address required" });
    }

    const host = await updateHostRecord(walletAddress, req.body);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    return res.json({ host });
  } catch (err: any) {
    console.error("Error updating host:", err);
    return res.status(500).json({ error: "Failed to update host" });
  }
});

// PUT /api/hosts/me/availability — set weekly rules
router.put("/me/availability", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) {
      return res.status(401).json({ error: "Wallet address required" });
    }

    const host = await getHostByWalletRecord(walletAddress);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const rules = await setHostAvailabilityRules(host.id, req.body);
    return res.json({ rules });
  } catch (err: any) {
    console.error("Error setting availability:", err);
    return res.status(500).json({ error: "Failed to set availability" });
  }
});

// PUT /api/hosts/me/overrides — set date-specific overrides
router.put("/me/overrides", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) {
      return res.status(401).json({ error: "Wallet address required" });
    }

    const host = await getHostByWalletRecord(walletAddress);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const overrides = await setHostDateOverrides(host.id, req.body);
    return res.json({ overrides });
  } catch (err: any) {
    console.error("Error setting overrides:", err);
    return res.status(500).json({ error: "Failed to set overrides" });
  }
});

// ============================================
// Parameterized routes (/:slug) — AFTER static routes
// ============================================

// GET /api/hosts/:slug — host profile + availability
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const host = await getHostBySlugRecord(req.params.slug);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const rules = await getHostAvailabilityRules(host.id);

    return res.json({
      host: {
        name: host.name,
        bio: host.bio,
        avatarUrl: host.avatarUrl,
        slug: host.slug,
        rate: host.rate,
        durationMinutes: host.durationMinutes,
        timezone: host.timezone,
      },
      availability: rules.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    });
  } catch (err: any) {
    console.error("Error fetching host:", err);
    return res.status(500).json({ error: "Failed to fetch host" });
  }
});

// GET /api/hosts/:slug/slots?date=2026-04-20
router.get("/:slug/slots", async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    if (!date || typeof date !== "string") {
      return res
        .status(400)
        .json({ error: "date query param required (YYYY-MM-DD)" });
    }

    const host = await getHostBySlugRecord(req.params.slug);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const slots = await getAvailableSlots(
      host.id,
      date,
      host.durationMinutes
    );

    return res.json({ date, slots });
  } catch (err: any) {
    console.error("Error fetching slots:", err);
    return res.status(500).json({ error: "Failed to fetch slots" });
  }
});

export default router;