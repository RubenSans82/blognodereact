import React, { useState, useEffect } from 'react';

const Typewriter = ({ text, speed = 150, style }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    setCurrentIndex(0);
    setDisplayedText('');
  }, [text]);

  useEffect(() => {
    if (!text || currentIndex >= text.length) return;

    const timeoutId = setTimeout(() => {
      setDisplayedText((prev) => prev + text[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timeoutId);
  }, [text, currentIndex, speed]);

  return <p style={style}>{displayedText}</p>;
};

export default Typewriter;
