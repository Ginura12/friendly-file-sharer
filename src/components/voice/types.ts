// Define valid call statuses as a const to ensure consistency
export const CALL_STATUSES = {
  PENDING: 'pending',
  CALLING: 'calling', 
  CONNECTED: 'connected',
  ENDED: 'ended',
  REJECTED: 'rejected'
} as const;

export type CallStatus = typeof CALL_STATUSES[keyof typeof CALL_STATUSES];