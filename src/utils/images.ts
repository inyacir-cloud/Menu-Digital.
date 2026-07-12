import type { SyntheticEvent } from 'react';

export const DEFAULT_PRODUCT_IMAGE = '/Logo.png';

export function handleProductImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = DEFAULT_PRODUCT_IMAGE;
  image.classList.add('object-contain', 'bg-white', 'p-2');
}