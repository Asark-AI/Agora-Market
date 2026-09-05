import type { DeliveryAttempt, DeliveryEvent, DeliveryProof, DeliveryStatus, Order, RiderAssignment, Shipment } from '@/lib/types';

export type DemoDeliveryState = {
  order: Order;
  shipment: Shipment;
  delivery: {
    id: string;
    orderId: string;
    shipmentId: string;
    buyerId: string;
    sellerId: string;
    provider: 'AGORA';
    status: DeliveryStatus;
    riderId: string;
    deliveryFee: number;
    pricingVersion: string;
    createdAt: string;
    updatedAt: string;
  };
  assignment: RiderAssignment;
  events: DeliveryEvent[];
  attempts: DeliveryAttempt[];
  proof?: DeliveryProof;
  riderOnline: boolean;
};

export const DEMO_OTP = '4821';
export const DEMO_STORAGE_KEY = 'agora-delivery-demo-v1';

export const createDemoDeliveryState = (): DemoDeliveryState => {
  const now = new Date().toISOString();
  const order: Order = {
    id: 'AG-10482',
    buyerId: 'demo-buyer',
    userId: 'demo-buyer',
    date: now,
    total: 170,
    status: 'pending',
    items: [{ productId: 'demo-product', quantity: 1, price: 150 }],
    paymentMethod: 'flutterwave',
    shipmentIds: ['SHP-DEMO-10482'],
  };
  return {
    order,
    shipment: { id: 'SHP-DEMO-10482', orderId: order.id, sellerId: 'demo-seller', itemIds: ['demo-product'], status: 'CREATED', deliveryId: 'DL-DEMO-10482' },
    delivery: { id: 'DL-DEMO-10482', orderId: order.id, shipmentId: 'SHP-DEMO-10482', buyerId: order.buyerId, sellerId: 'demo-seller', provider: 'AGORA', status: 'ASSIGNED', riderId: 'demo-rider', deliveryFee: 20, pricingVersion: 'demo-v1', createdAt: now, updatedAt: now },
    assignment: { id: 'ASN-DEMO-10482', deliveryId: 'DL-DEMO-10482', riderId: 'demo-rider', status: 'OFFERED', offeredAt: now, expiresAt: new Date(Date.now() + 180000).toISOString() },
    events: [{ id: 'EVT-DEMO-CREATED', deliveryId: 'DL-DEMO-10482', type: 'delivery.created', status: 'CREATED', actorId: 'demo-system', createdAt: now }],
    attempts: [],
    riderOnline: false,
  };
};

export function readDemoDeliveryState(): DemoDeliveryState {
  if (typeof window === 'undefined') return createDemoDeliveryState();
  try {
    const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return saved ? JSON.parse(saved) as DemoDeliveryState : createDemoDeliveryState();
  } catch {
    return createDemoDeliveryState();
  }
}

export function writeDemoDeliveryState(state: DemoDeliveryState): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

export function resetDemoDeliveryState(): DemoDeliveryState {
  const state = createDemoDeliveryState();
  writeDemoDeliveryState(state);
  return state;
}

export function advanceDemoDelivery(state: DemoDeliveryState, status: DeliveryStatus, actorId = 'demo-rider'): DemoDeliveryState {
  const now = new Date().toISOString();
  const next = { ...state, delivery: { ...state.delivery, status, updatedAt: now }, shipment: { ...state.shipment, status }, assignment: { ...state.assignment } };
  next.events = [...state.events, { id: `EVT-${Date.now()}`, deliveryId: state.delivery.id, type: `delivery.${status.toLowerCase()}`, status, actorId, createdAt: now }];
  if (status === 'ACCEPTED') next.assignment.status = 'ACCEPTED';
  if (status === 'DELIVERED') {
    next.order = { ...state.order, status: 'delivered' };
    next.attempts = [...state.attempts, { id: `ATT-${Date.now()}`, deliveryId: state.delivery.id, attemptNumber: state.attempts.length + 1, riderId: actorId, result: 'DELIVERED', createdAt: now }];
  }
  return next;
}