export class SubscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionError';
  }
}

export const SUBSCRIPTION_LIMITS = {
  FREE: 1,
  PRO: Infinity,
} as const;

export function validateSubscriptionLimit(currentCount: number, isPro: boolean): void {
  if (!isPro && currentCount >= SUBSCRIPTION_LIMITS.FREE) {
    throw new SubscriptionError('Free users can only create one tournament. Upgrade to Pro for unlimited tournaments.');
  }
}
