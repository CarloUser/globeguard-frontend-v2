/**
 * Order states in which the payment has not been settled or authorised yet. Kept out of
 * payment-pending-status.tsx: a value exported from a 'use client' module reaches a server
 * component only as a client reference, not as the array.
 */
export const PENDING_ORDER_STATES: readonly string[] = ['AddingItems', 'ArrangingPayment'];
