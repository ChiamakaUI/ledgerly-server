import { Router, Request, Response } from "express";
import {
  createBookingRecord,
  confirmPayment,
  confirmCallCompleted,
  cancelBooking,
  getBooking,
  listCallerBookings,
  listHostBookings,
  joinCall,
} from "../services/booking.service.js";
import { getHostByWalletRecord } from "../services/host.service.js";
import { booking_status } from "../queries/booking.queries.js";

const router = Router();

// ============================================
// Static/prefixed routes MUST come before /:id routes
// ============================================

// GET /api/bookings/caller/:wallet — list caller's bookings
router.get("/caller/:wallet", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await listCallerBookings(req.params.wallet, limit, offset);
    return res.json({
      bookings: result.bookings,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.bookings.length < result.total,
      },
    });
  } catch (err: any) {
    console.error("Error listing caller bookings:", err);
    return res.status(500).json({ error: "Failed to list bookings" });
  }
});

// GET /api/bookings/host/me — list host's bookings
router.get("/host/me", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) {
      return res.status(401).json({ error: "Wallet address required" });
    }

    const host = await getHostByWalletRecord(walletAddress);
    if (!host) {
      return res.status(404).json({ error: "Host not found" });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as booking_status | undefined;

    const result = await listHostBookings(host.id, status, limit, offset);
    return res.json({
      bookings: result.bookings,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.bookings.length < result.total,
      },
    });
  } catch (err: any) {
    console.error("Error listing host bookings:", err);
    return res.status(500).json({ error: "Failed to list bookings" });
  }
});

// ============================================
// Create booking
// ============================================

// POST /api/bookings — create booking + get deposit instruction
router.post("/", async (req: Request, res: Response) => {
  try {
    const { callerName, callerEmail } = req.body;
    if (!callerName?.trim()) {
      return res.status(400).json({ error: "callerName is required" });
    }
    if (!callerEmail?.trim()) {
      return res.status(400).json({ error: "callerEmail is required" });
    }

    const result = await createBookingRecord(req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    console.error("Error creating booking:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("no longer available")
        ? 409
        : err.message.includes("past")
          ? 400
          : 500;
    return res.status(status).json({ error: err.message });
  }
});

// ============================================
// Parameterized routes (/:id) — AFTER static routes
// ============================================

// GET /api/bookings/:id — get booking details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const booking = await getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    return res.json({ booking });
  } catch (err: any) {
    console.error("Error fetching booking:", err);
    return res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// POST /api/bookings/:id/confirm-payment — record deposit signature
router.post("/:id/confirm-payment", async (req: Request, res: Response) => {
  try {
    const { signature } = req.body;
    if (!signature) {
      return res.status(400).json({ error: "signature is required" });
    }

    const booking = await confirmPayment(req.params.id, signature);
    return res.json({ booking });
  } catch (err: any) {
    console.error("Error confirming payment:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("expired")
        ? 410
        : 400;
    return res.status(status).json({ error: err.message });
  }
});

// POST /api/bookings/:id/confirm-call — host confirms call happened (Phase 1)
router.post("/:id/confirm-call", async (req: Request, res: Response) => {
  try {
    const { hostWallet } = req.body;
    if (!hostWallet) {
      return res.status(400).json({ error: "hostWallet is required" });
    }

    const booking = await confirmCallCompleted(req.params.id, hostWallet);
    return res.json({ booking });
  } catch (err: any) {
    console.error("Error confirming call:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("Only")
        ? 403
        : 400;
    return res.status(status).json({ error: err.message });
  }
});

// GET /api/bookings/:id/join?wallet=...&name=... — get call token
router.get("/:id/join", async (req: Request, res: Response) => {
  try {
    const wallet = req.query.wallet as string;
    const name = req.query.name as string | undefined;

    if (!wallet) {
      return res.status(400).json({ error: "wallet query param required" });
    }

    const result = await joinCall(req.params.id, wallet, name);
    return res.json(result);
  } catch (err: any) {
    console.error("Error joining call:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("not a participant")
        ? 403
        : err.message.includes("hasn't started")
          ? 425 // Too Early
          : err.message.includes("passed")
            ? 410
            : 400;
    return res.status(status).json({ error: err.message });
  }
});

// POST /api/bookings/:id/cancel — caller cancels
router.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { callerWallet, reason } = req.body;
    if (!callerWallet) {
      return res.status(400).json({ error: "callerWallet is required" });
    }

    const booking = await cancelBooking(req.params.id, callerWallet, reason);
    return res.json({ booking });
  } catch (err: any) {
    console.error("Error cancelling booking:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("Only")
        ? 403
        : 400;
    return res.status(status).json({ error: err.message });
  }
});

// POST /api/bookings/:id/host-cancel — host cancels
router.post("/:id/host-cancel", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) {
      return res.status(401).json({ error: "Wallet address required" });
    }

    const booking = await cancelBooking(
      req.params.id,
      walletAddress,
      "Cancelled by host"
    );
    return res.json({ booking });
  } catch (err: any) {
    console.error("Error cancelling booking (host):", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("Only")
        ? 403
        : 400;
    return res.status(status).json({ error: err.message });
  }
});

export default router;