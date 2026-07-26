"use client";
import { useEffect, useRef, useState } from "react";

// Lays out the banner + the A4 sheet as one column whose width tracks the
// sheet's displayed width, so the banner's edges line up with the resume at
// every screen size. The sheet is a fixed 794×1123px (A4 @96dpi) and scales
// down to fit narrow screens; the banner keeps its own type size but matches
// the column width. Server-rendered banner/sheet are passed in as props.
const A4_W = 794;
const A4_H = 1123;

export default function PublicDoc({ banner, children }) {
  const rootRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    const measure = () => {
      const cs = getComputedStyle(parent);
      const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const avail = parent.clientWidth - pad;
      setScale(Math.min(1, avail / A4_W));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const width = A4_W * scale;

  return (
    <div className="public-doc" ref={rootRef} style={{ width }}>
      {banner}
      <div className="sheet-scaler" style={{ width, height: A4_H * scale }}>
        <div className="sheet-scaler__inner" style={{ transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
