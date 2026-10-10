'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

const POSITION_STORAGE_KEY = 'agora-floating-cart-position';
const FLOATING_CART_SIZE = 56;

type FloatingPosition = { left: number; top: number };
type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  left: number;
  top: number;
  moved: boolean;
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), Math.max(minimum, maximum));

const visibleRoute = (pathname: string) =>
  pathname === '/' ||
  ['/search', '/categories', '/products', '/flash-deals', '/wishlist', '/stores'].some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
  pathname.startsWith('/product/') ||
  pathname.startsWith('/store/');

function animateElement(element: HTMLElement | null, keyframes: Keyframe[], duration: number) {
  if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof element.animate !== 'function') return;
  element.getAnimations().forEach((animation) => animation.cancel());
  element.animate(keyframes, { duration, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)' });
}

export function FloatingCart() {
  const pathname = usePathname();
  const router = useRouter();
  const [portalReady, setPortalReady] = useState(false);
  const [dragPosition, setDragPosition] = useState<FloatingPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const itemCount = useCart((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const previousCount = useRef<number | null>(null);
  const dragState = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const safeAreaBottom = useRef(0);
  const isProductDetail = pathname.startsWith('/product/');
  const maximumTop = () =>
    window.innerHeight
    - FLOATING_CART_SIZE
    - safeAreaBottom.current
    - (window.innerWidth < 768 ? 88 : 8);

  useEffect(() => {
    setPortalReady(true);
    const safeAreaProbe = document.createElement('div');
    safeAreaProbe.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom);width:0;visibility:hidden;pointer-events:none';
    document.body.append(safeAreaProbe);
    safeAreaBottom.current = safeAreaProbe.getBoundingClientRect().height;
    safeAreaProbe.remove();

    try {
      const stored = window.sessionStorage.getItem(POSITION_STORAGE_KEY);
      if (stored) {
        const position = JSON.parse(stored) as Partial<FloatingPosition>;
        if (typeof position.left === 'number' && typeof position.top === 'number') {
          setDragPosition({
            left: clamp(position.left, 8, window.innerWidth - FLOATING_CART_SIZE - 8),
            top: clamp(position.top, 8, maximumTop()),
          });
        }
      }
    } catch {
      setDragPosition(null);
    }
  }, []);

  useEffect(() => {
    if (!portalReady) return;
    const handleResize = () => setDragPosition((position) => position ? {
      left: clamp(position.left, 8, window.innerWidth - FLOATING_CART_SIZE - 8),
      top: clamp(position.top, 8, maximumTop()),
    } : null);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [portalReady]);

  useEffect(() => {
    if (previousCount.current !== null && previousCount.current !== itemCount) {
      animateElement(badgeRef.current, [
        { transform: 'scale(0.7)' },
        { transform: 'scale(1.15)', offset: 0.65 },
        { transform: 'scale(1)' },
      ], 260);
    }
    previousCount.current = itemCount;
  }, [itemCount]);

  useEffect(() => {
    const handleCartArrival = () => {
      animateElement(cartButtonRef.current, [
        { transform: 'scale(1)' },
        { transform: 'scale(1.15)', offset: 0.35 },
        { transform: 'scale(0.96)', offset: 0.7 },
        { transform: 'scale(1)' },
      ], 320);
    };
    window.addEventListener('agora:cart-arrival', handleCartArrival);
    return () => window.removeEventListener('agora:cart-arrival', handleCartArrival);
  }, []);

  if (!portalReady || !visibleRoute(pathname)) return null;

  const ariaLabel = itemCount > 0 ? `Open cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : 'Open cart';
  const positionClass = isProductDetail
    ? 'bottom-[calc(9rem+env(safe-area-inset-bottom))] md:bottom-20'
    : 'bottom-[calc(6rem+env(safe-area-inset-bottom))]';

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      left: rect.left,
      top: rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;

    drag.moved = true;
    drag.left = clamp(drag.originLeft + deltaX, 8, window.innerWidth - FLOATING_CART_SIZE - 8);
    drag.top = clamp(drag.originTop + deltaY, 8, maximumTop());
    setIsDragging(true);
    setDragPosition({ left: drag.left, top: drag.top });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragState.current = null;
    setIsDragging(false);
    if (!drag.moved) return;

    const rightPosition = window.innerWidth - FLOATING_CART_SIZE - 8;
    const snappedPosition = {
      left: drag.left <= window.innerWidth / 2 ? 8 : rightPosition,
      top: clamp(drag.top, 8, maximumTop()),
    };
    setDragPosition(snappedPosition);
    try {
      window.sessionStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(snappedPosition));
    } catch {
      // Keep the snapped position for the current page even when storage is unavailable.
    }
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 150);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      event.preventDefault();
      return;
    }
    router.push('/cart');
  };

  return createPortal((
    <button
      ref={cartButtonRef}
      type="button"
      data-floating-cart
      aria-label={ariaLabel}
      title={ariaLabel}
      aria-hidden={itemCount === 0}
      tabIndex={itemCount === 0 ? -1 : 0}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`fixed z-40 inline-flex size-14 touch-none select-none items-center justify-center rounded-full border border-white/80 bg-[#d65a24] text-white shadow-[0_6px_20px_rgba(28,38,51,0.24)] transition-[color,opacity,transform] duration-200 hover:bg-[#bd4a1c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1769aa] focus-visible:ring-offset-2 ${dragPosition ? '' : `right-4 ${positionClass}`} ${itemCount > 0 ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-90 opacity-0'} ${isDragging ? 'cursor-grabbing transition-none' : 'cursor-grab active:scale-95'}`}
      style={dragPosition ? { left: dragPosition.left, top: dragPosition.top } : undefined}
    >
      <ShoppingCart className="size-6" aria-hidden="true" />
      {itemCount > 0 && <span ref={badgeRef} className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#1c2633] px-1 text-[10px] font-bold leading-none text-white">{itemCount > 99 ? '99+' : itemCount}</span>}
    </button>
  ), document.body);
}