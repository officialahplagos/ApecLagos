"use client";

import { useEffect, useRef, useState } from "react";

type Stat = {
  label: string;
  value: number;
};

type StatGridProps = {
  stats: Stat[];
};

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function StatGrid({ stats }: StatGridProps) {
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState(() => stats.map(() => 0));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    let frame = 0;
    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);

      setValues(stats.map((stat) => Math.round(stat.value * eased)));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stats, visible]);

  return (
    <div className="status-grid" ref={ref}>
      {stats.map((stat, index) => (
        <div key={stat.label}>
          <strong>{values[index].toLocaleString()}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
