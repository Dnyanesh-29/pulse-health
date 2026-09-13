import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({ value, duration = 1.2 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseInt(value, 10);
  const isNumber = !isNaN(numericValue);

  useEffect(() => {
    if (!isNumber) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easeProgress * numericValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(numericValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [numericValue, isNumber, duration]);

  if (!isNumber) {
    return <span>{value}</span>;
  }

  return <span>{displayValue}</span>;
}
