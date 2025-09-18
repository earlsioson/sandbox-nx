export class OnboardingStatus {
  constructor(
    readonly value:
      | 'NEW'
      | 'WATCHLIST'
      | 'PENDING'
      | 'ACTIVE'
      | 'REVIEWED'
      | 'CHANGED'
  ) {}

  equals(status: OnboardingStatus): boolean {
    return this.value === status.value;
  }

  isActive(): boolean {
    return this.value === 'ACTIVE';
  }

  isInProgress(): boolean {
    return this.value === 'PENDING' || this.value === 'WATCHLIST';
  }

  canTransitionTo(newStatus: OnboardingStatus): boolean {
    const transitions: Record<string, string[]> = {
      NEW: ['WATCHLIST'],
      WATCHLIST: ['PENDING', 'REVIEWED'],
      PENDING: ['ACTIVE'],
      ACTIVE: ['CHANGED'],
      REVIEWED: ['WATCHLIST'],
      CHANGED: ['WATCHLIST'],
    };

    return transitions[this.value]?.includes(newStatus.value) || false;
  }
}
