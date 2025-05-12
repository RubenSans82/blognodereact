import React, { useState, useEffect, useRef } from 'react';

const Typewriter = ({ text, speed = 150, style, maxLines = null, onComplete = null }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const pRef = useRef(null); // Ref para el elemento <p>
  const [textTransform, setTextTransform] = useState('translateY(0px)'); // Estado para la transformación
  const onCompleteCalledRef = useRef(false); // Ref para asegurar que onComplete se llame solo una vez por texto

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setCurrentIndex(0);
      setTextTransform('translateY(0px)');
      onCompleteCalledRef.current = false; // Resetear al cambiar el texto
      return;
    }
    setDisplayedText('');
    setCurrentIndex(0);
    setTextTransform('translateY(0px)');
    onCompleteCalledRef.current = false; // Resetear al cambiar el texto
  }, [text]);

  useEffect(() => {
    if (!text) return;

    if (currentIndex >= text.length) {
      if (onComplete && !onCompleteCalledRef.current) {
        onComplete();
        onCompleteCalledRef.current = true; // Marcar como llamado
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      setDisplayedText((prev) => prev + text[currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timeoutId);
  }, [text, currentIndex, speed, onComplete]);

  // Efecto para calcular y aplicar el desplazamiento vertical
  useEffect(() => {
    if (pRef.current && maxLines && style.lineHeight && style.fontSize) {
      const pElement = pRef.current;
      const computedStyle = window.getComputedStyle(pElement);
      
      let lineHeightPx = parseFloat(computedStyle.lineHeight);

      // Si lineHeightPx no es un número válido (ej. 'normal'), intentar calcularlo
      if (isNaN(lineHeightPx) || lineHeightPx <= 0) {
        const fontSizePx = parseFloat(computedStyle.fontSize);
        if (!isNaN(fontSizePx) && fontSizePx > 0) {
          // Asumir que style.lineHeight es un multiplicador si es un número, o usar un valor por defecto
          const lineHeightMultiplier = parseFloat(style.lineHeight) || 1.2; 
          lineHeightPx = fontSizePx * lineHeightMultiplier;
        }
      }

      if (isNaN(lineHeightPx) || lineHeightPx <= 0) {
        setTextTransform('translateY(0px)'); // No se pudo determinar, resetear
        return;
      }

      const maxVisibleHeight = maxLines * lineHeightPx;
      
      if (pElement.scrollHeight > maxVisibleHeight) {
        const scrollOffset = pElement.scrollHeight - maxVisibleHeight;
        setTextTransform(`translateY(-${scrollOffset}px)`);
      } else {
        setTextTransform('translateY(0px)');
      }
    } else {
      setTextTransform('translateY(0px)'); // Reset si no hay condiciones para calcular
    }
  }, [displayedText, maxLines, style.lineHeight, style.fontSize, style.width, style.maxWidth]); // Añadir dependencias que afectan al layout


  const pStyle = { ...style }; 
  const wrapperStyle = {};   

  if (pStyle.maxWidth) {
    wrapperStyle.maxWidth = pStyle.maxWidth;
    delete pStyle.maxWidth;
  }
  if (pStyle.margin) {
    wrapperStyle.margin = pStyle.margin;
    delete pStyle.margin;
  }

  pStyle.width = '100%';
  pStyle.margin = '0'; 

  if (maxLines && style.lineHeight && style.fontSize) {
    const fsMatch = String(style.fontSize).match(/([\d\.]+)(\w+)/);
    if (fsMatch) {
      const fsValue = parseFloat(fsMatch[1]);
      const fsUnit = fsMatch[2];
      const lhValue = parseFloat(style.lineHeight); // Usar el style.lineHeight original para el cálculo de altura del wrapper

      if (!isNaN(fsValue) && fsUnit && !isNaN(lhValue)) {
        wrapperStyle.height = `${maxLines * lhValue * fsValue}${fsUnit}`;
        wrapperStyle.overflow = 'hidden';
        // Ya no se usa flex para alinear abajo
      }
    }
  }

  return (
    <div style={wrapperStyle}>
      <p ref={pRef} style={{ ...pStyle, transform: textTransform, transition: 'transform 0.1s linear' }}>{displayedText}</p>
    </div>
  );
};

export default Typewriter;
