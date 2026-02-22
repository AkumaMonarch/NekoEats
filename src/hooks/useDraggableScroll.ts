import { useCallback, useRef } from 'react';

export function useDraggableScroll() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (!sliderRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX;
    scrollLeft.current = sliderRef.current.scrollLeft;
    sliderRef.current.style.cursor = 'grabbing';
    sliderRef.current.style.userSelect = 'none';
  }, []);

  const onMouseUp = useCallback(() => {
    if (!sliderRef.current) return;
    isDragging.current = false;
    sliderRef.current.style.cursor = 'grab';
    sliderRef.current.style.removeProperty('user-select');
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startX.current) * 1.5; // Scroll speed
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  const ref = useCallback((node: HTMLDivElement | null) => {
    if (sliderRef.current) {
      // Cleanup old listeners
      sliderRef.current.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    }

    sliderRef.current = node;

    if (node) {
      // Attach new listeners
      node.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
      node.style.cursor = 'grab';
    }
  }, [onMouseDown, onMouseUp, onMouseMove]);

  return ref;
}
