export function clampGalleryIndex(index, delta, count) {
  return Math.max(0, Math.min(count - 1, index + delta));
}

export function galleryIndexFromScroll(scrollLeft, slideWidth, count) {
  if (!slideWidth || count < 1) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(scrollLeft / slideWidth)));
}

export function initializeGallery(root) {
  const track = root.querySelector('[data-gallery-track]');
  if (!track) return null;
  const slides = [...track.querySelectorAll('[data-gallery-slide]')];
  const previous = root.querySelector('[data-gallery-prev]');
  const next = root.querySelector('[data-gallery-next]');
  const count = root.querySelector('[data-gallery-count]');
  let index = 0;

  const sync = () => {
    index = galleryIndexFromScroll(track.scrollLeft, track.clientWidth, slides.length);
    if (count) count.textContent = `${index + 1} / ${slides.length}`;
    if (previous) previous.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
  };
  const move = (delta) => {
    const target = clampGalleryIndex(index, delta, slides.length);
    slides[target]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    index = target;
    sync();
  };

  previous?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));
  track.addEventListener('scroll', sync, { passive: true });
  sync();
  return { move, sync };
}
