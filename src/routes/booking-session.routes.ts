import { Router, Request, Response } from "express";
import {
  createSessionRecord,
  bookSession,
  getSession,
  listHostSessions,
  listOpenSessions,
  cancelSessionRecord,
} from "../services/booking-session.service.js";
import { getHostByWalletRecord } from "../services/host.service.js";
import { confirmPayment, joinCall } from "../services/booking.service.js";

const router = Router();

// ============================================
// Public routes
// ============================================

// GET /api/sessions/host/:slug — list open sessions for a host's booking page
router.get("/host/:slug", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const sessions = await listOpenSessions(req.params.slug, limit, offset);
    return res.json({ sessions });
  } catch (err: any) {
    console.error("Error listing sessions:", err);
    return res.status(500).json({ error: "Failed to list sessions" });
  }
});

// GET /api/sessions/:id — session details with spots remaining
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    return res.json({ session });
  } catch (err: any) {
    console.error("Error fetching session:", err);
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

// ============================================
// Caller routes
// ============================================

// POST /api/sessions/:id/book — book a spot in a session
router.post("/:id/book", async (req: Request, res: Response) => {
  try {
    const { callerWallet, callerName, callerEmail } = req.body;

    if (!callerWallet) {
      return res.status(400).json({ error: "callerWallet is required" });
    }
    if (!callerName?.trim()) {
      return res.status(400).json({ error: "callerName is required" });
    }
    if (!callerEmail?.trim()) {
      return res.status(400).json({ error: "callerEmail is required" });
    }

    const result = await bookSession({
      sessionId: req.params.id,
      callerWallet,
      callerName,
      callerEmail,
    });

    return res.status(201).json(result);
  } catch (err: any) {
    console.error("Error booking session:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("fully booked") || err.message.includes("full")
        ? 409
        : err.message.includes("already started")
          ? 410
          : err.message.includes("duplicate key") // ← add this
            ? 409
            : 400;

    // And override the message for duplicate key errors
    const message = err.message.includes("duplicate key")
      ? "You have already booked this session"
      : err.message;

    return res.status(status).json({ error: message });
  }
});

// POST /api/sessions/booking/:bookingId/confirm-payment — confirm deposit for a session booking
router.post(
  "/booking/:bookingId/confirm-payment",
  async (req: Request, res: Response) => {
    try {
      const { signature } = req.body;
      if (!signature) {
        return res.status(400).json({ error: "signature is required" });
      }

      const booking = await confirmPayment(req.params.bookingId, signature);
      return res.json({ booking });
    } catch (err: any) {
      console.error("Error confirming session payment:", err);
      const status = err.message.includes("not found")
        ? 404
        : err.message.includes("expired")
          ? 410
          : 400;
      return res.status(status).json({ error: err.message });
    }
  },
);

// GET /api/sessions/:id/join — join a session call
router.get("/:id/join", async (req: Request, res: Response) => {
  try {
    const wallet = req.query.wallet as string;
    const name = req.query.name as string | undefined;

    if (!wallet) {
      return res.status(400).json({ error: "wallet query param required" });
    }

    // Get session to find the booking for this caller
    const session = await getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // For the host, we need to find any paid booking in this session
    // to get the vidbloq_room. The host joins via the session, not a specific booking.
    // For callers, find their specific booking.
    // We use the session's vidbloq_room directly.

    // TODO: For now, find the caller's booking and use its joinCall flow.
    // This works because joinCall validates the wallet against the booking.
    // For hosts joining group sessions, we need a separate flow.

    // Try to find this wallet's booking in the session
    const pool = (await import("../config/index.js")).getPool();
    const { camelizeKeys } = await import("../config/index.js");

    const result = await pool.query(
      `SELECT id FROM bookings
       WHERE session_id = $1
       AND (caller_wallet = $2)
       AND status IN ('paid', 'active')
       LIMIT 1`,
      [req.params.id, wallet],
    );

    if (result.rows.length > 0) {
      // Caller joining — use their booking
      const joinResult = await joinCall(result.rows[0].id, wallet, name);
      return res.json(joinResult);
    }

    // Check if this is the host
    const hostResult = await pool.query(
      `SELECT h.wallet_address FROM sessions s
       JOIN hosts h ON s.host_id = h.id
       WHERE s.id = $1`,
      [req.params.id],
    );

    if (
      hostResult.rows.length > 0 &&
      hostResult.rows[0].wallet_address === wallet
    ) {
      // Host joining — find any paid booking to get the room
      const bookingResult = await pool.query(
        `SELECT id FROM bookings
         WHERE session_id = $1
         AND status IN ('paid', 'active')
         LIMIT 1`,
        [req.params.id],
      );

      if (bookingResult.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "No paid bookings in this session yet" });
      }

      const joinResult = await joinCall(bookingResult.rows[0].id, wallet, name);
      return res.json(joinResult);
    }

    return res
      .status(403)
      .json({ error: "You are not a participant in this session" });
  } catch (err: any) {
    console.error("Error joining session:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("not a participant")
        ? 403
        : err.message.includes("hasn't started")
          ? 425
          : 400;
    return res.status(status).json({ error: err.message });
  }
});

// ============================================
// Host routes
// ============================================

// POST /api/sessions — create a session
router.post("/", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) {
      return res.status(401).json({ error: "Wallet address required" });
    }

    const session = await createSessionRecord(req.body);
    return res.status(201).json({ session });
  } catch (err: any) {
    console.error("Error creating session:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("past")
        ? 400
        : 500;
    return res.status(status).json({ error: err.message });
  }
});

// GET /api/sessions/host-dashboard/me — list host's own sessions
router.get("/host-dashboard/me", async (req: Request, res: Response) => {
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
    const upcoming = req.query.upcoming === "true";

    const sessions = await listHostSessions(host.id, upcoming, limit, offset);
    return res.json({ sessions });
  } catch (err: any) {
    console.error("Error listing host sessions:", err);
    return res.status(500).json({ error: "Failed to list sessions" });
  }
});

// POST /api/sessions/:id/cancel — host cancels session (refunds all)
router.post("/:id/cancel", async (req: Request, res: Response) => {
  try {
    const walletAddress = req.headers["x-wallet-address"] as string;
    if (!walletAddress) {
      return res.status(401).json({ error: "Wallet address required" });
    }

    const result = await cancelSessionRecord(req.params.id, walletAddress);
    return res.json(result);
  } catch (err: any) {
    console.error("Error cancelling session:", err);
    const status = err.message.includes("not found")
      ? 404
      : err.message.includes("Only")
        ? 403
        : 400;
    return res.status(status).json({ error: err.message });
  }
});

export default router;
