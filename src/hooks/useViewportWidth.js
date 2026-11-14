import { useEffect, useState } from 'react';

function getViewportWidth() {
  return document.documentElement.clientWidth;
}

// The layout viewport's width (excluding the scrollbar), kept current on resize.
export function useViewportWidth() {
  const [width, setWidth] = useState(getViewportWidth);

  useEffect(() => {
    const handleResize = () => setWidth(getViewportWidth());

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}
