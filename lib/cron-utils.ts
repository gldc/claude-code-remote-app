/**
 * Shared cron expression utilities.
 */

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Convert a cron expression to a human-readable string.
 */
export function describeCron(cron: string): string {
  try {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return cron;
    const [min, hour, dom, , dow] = parts;

    if (hour === '*') return `Every hour at :${min.padStart(2, '0')}`;
    if (dow !== '*' && dom === '*') {
      const dayNames = dow.split(',').map((d) => {
        const idx = parseInt(d, 10);
        return DAYS_OF_WEEK[idx] ?? d;
      });
      return `${dayNames.join(', ')} at ${hour}:${min.padStart(2, '0')}`;
    }
    if (dom !== '*') return `Day ${dom} of every month at ${hour}:${min.padStart(2, '0')}`;
    return `Every day at ${hour}:${min.padStart(2, '0')}`;
  } catch {
    return cron;
  }
}
