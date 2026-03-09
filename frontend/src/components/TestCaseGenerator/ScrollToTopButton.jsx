import React, { useEffect, useState } from "react";

export default function ScrollToTopButton({ targetRef }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    const onScroll = () => {
      setVisible(el.scrollTop > 200);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [targetRef]);

  const scrollToTop = () => {
    if (targetRef.current) {
      targetRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!visible) return null;

  return (
    <button className="scroll-top-btn" onClick={scrollToTop}>
      ↑
    </button>
  );
}
