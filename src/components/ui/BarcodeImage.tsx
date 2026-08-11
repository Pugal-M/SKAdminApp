import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeImageProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export const BarcodeImage: React.FC<BarcodeImageProps> = ({ 
  value, 
  format = "CODE128", 
  width = 1.5, 
  height = 40,
  displayValue = true,
  className 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          margin: 0,
          background: "transparent"
        });
      } catch (e) {
        console.error("Invalid barcode format", e);
      }
    }
  }, [value, format, width, height, displayValue]);

  if (!value) return null;

  return <svg ref={svgRef} className={className}></svg>;
};
