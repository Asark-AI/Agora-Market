import type { DeliveryStatus } from '@/lib/types';

const transitions: Record<DeliveryStatus, readonly DeliveryStatus[]> = {
    CREATED: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED: ['ACCEPTED', 'CREATED', 'CANCELLED'],
    ACCEPTED: ['PICKUP_STARTED', 'CANCELLED'],
    PICKUP_STARTED: ['PICKED_UP', 'FAILED'],
    PICKED_UP: ['IN_TRANSIT', 'FAILED'],
    IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED'],
    OUT_FOR_DELIVERY: ['ARRIVED', 'FAILED'],
    ARRIVED: ['DELIVERED', 'FAILED'],
    DELIVERED: [],
    FAILED: ['ASSIGNED', 'RETURN_REQUESTED'],
    CANCELLED: [],
    RETURN_REQUESTED: ['RETURNED'],
    RETURNED: [],
};

export class InvalidDeliveryTransitionError extends Error {
    constructor(from: DeliveryStatus, to: DeliveryStatus) {
        super(`Cannot transition delivery from ${from} to ${to}.`);
        this.name = 'InvalidDeliveryTransitionError';
    }
}

export function canTransitionDelivery(from: DeliveryStatus, to: DeliveryStatus): boolean {
    return transitions[from].includes(to);
}

export function assertDeliveryTransition(from: DeliveryStatus, to: DeliveryStatus): void {
    if (!canTransitionDelivery(from, to)) {
        throw new InvalidDeliveryTransitionError(from, to);
    }
}

export function getAllowedDeliveryTransitions(status: DeliveryStatus): readonly DeliveryStatus[] {
    return transitions[status];
}