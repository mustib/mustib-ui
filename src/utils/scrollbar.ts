import { getScrollbarWidth } from '@mustib/utils/dist/browser';

export function disablePageScroll() {
  if (document.body.hasAttribute('mu-no-scroll')) return;

  const baseMarginInlineEnd = getComputedStyle(document.body).marginInlineEnd;
  const baseMarginInlineEndWithoutPixels = +baseMarginInlineEnd.slice(0, -2);
  const scrollbarWidth = getScrollbarWidth();

  document.body.setAttribute('mu-no-scroll', '');

  document.body.style.setProperty('--mu-no-scroll-margin-inline-end', baseMarginInlineEndWithoutPixels + scrollbarWidth + 'px');
}

export function enablePageScroll() {
  if (!document.body.hasAttribute('mu-no-scroll')) return;

  document.body.removeAttribute('mu-no-scroll');
  document.body.style.removeProperty('--mu-no-scroll-margin-inline-end');
}
