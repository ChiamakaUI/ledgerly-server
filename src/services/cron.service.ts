import { expireUnpaid, handleNoShows } from "./booking.service.js";

let cronInterval: ReturnType<typeof setInterval> | null = null;

export function startCronJobs() {
  console.log("Starting cron jobs...");

  cronInterval = setInterval(
    async () => {
      try {
        const expired = await expireUnpaid();
        if (expired > 0) {
          console.log(`[CRON] Expired ${expired} unpaid booking(s)`);
        }

        const refunded = await handleNoShows();
        if (refunded > 0) {
          console.log(`[CRON] Refunded ${refunded} no-show booking(s)`);
        }
      } catch (err) {
        console.error("[CRON] Error running cron jobs:", err);
      }
    },
    5 * 60 * 1000,
  );

  setTimeout(async () => {
    try {
      const expired = await expireUnpaid();
      const refunded = await handleNoShows();
      console.log(
        `[CRON] Startup run: expired ${expired}, refunded ${refunded}`,
      );
    } catch (err) {
      console.error("[CRON] Startup run error:", err);
    }
  }, 10_000);
}

export function stopCronJobs() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    console.log("Cron jobs stopped");
  }
}
