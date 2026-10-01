export function animateProductToFloatingCart(source: Element | null) {
  if (!source || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cartButton = document.querySelector<HTMLElement>('[data-floating-cart]');
  const image = source instanceof HTMLImageElement ? source : source.querySelector('img');
  if (!cartButton || !image || typeof image.animate !== 'function') return;

  const imageRect = image.getBoundingClientRect();
  const cartRect = cartButton.getBoundingClientRect();
  if (!imageRect.width || !imageRect.height || !cartRect.width || !cartRect.height) return;

  const flyer = document.createElement('img');
  flyer.src = image.currentSrc || image.src;
  flyer.alt = '';
  flyer.setAttribute('aria-hidden', 'true');
  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${imageRect.left}px`,
    top: `${imageRect.top}px`,
    width: `${imageRect.width}px`,
    height: `${imageRect.height}px`,
    objectFit: 'contain',
    borderRadius: '8px',
    pointerEvents: 'none',
    zIndex: '9999',
    transformOrigin: 'center center',
    willChange: 'transform, opacity',
  });
  document.body.append(flyer);

  const deltaX = cartRect.left + cartRect.width / 2 - (imageRect.left + imageRect.width / 2);
  const deltaY = cartRect.top + cartRect.height / 2 - (imageRect.top + imageRect.height / 2);
  const arcHeight = Math.min(96, Math.max(42, Math.abs(deltaX) * 0.12));
  const animation = flyer.animate(
    [
      { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 0.96, offset: 0 },
      { transform: `translate3d(${deltaX * 0.48}px, ${deltaY * 0.48 - arcHeight}px, 0) scale(0.62)`, opacity: 0.88, offset: 0.55 },
      { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.12)`, opacity: 0.12, offset: 1 },
    ],
    { duration: 620, easing: 'cubic-bezier(0.22, 0.72, 0.28, 1)' }
  );

  const finish = () => {
    flyer.remove();
    window.dispatchEvent(new Event('agora:cart-arrival'));
  };
  animation.onfinish = finish;
  animation.oncancel = () => flyer.remove();
}