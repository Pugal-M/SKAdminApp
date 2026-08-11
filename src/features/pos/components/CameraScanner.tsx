import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface CameraScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // We must wait for the modal animation to finish before initializing the scanner div
    const timer = setTimeout(() => {
      if (!document.getElementById("reader")) return;
      
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true
        },
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          // Prevent multiple rapid scans of the same code
          scannerRef.current?.pause(true);
          
          // Play a success sound
          const audio = new Audio('/success-scan.mp3');
          audio.play().catch(e => console.log('Audio play prevented', e));

          onScan(decodedText);
          
          // Wait 1 second before resuming
          setTimeout(() => {
            scannerRef.current?.resume();
          }, 1000);
        },
        () => {
          // Ignored - usually just means no barcode is currently in view
        }
      );
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [isOpen, onScan]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-black border-zinc-800">
        <div className="relative w-full h-[400px]">
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="absolute top-4 left-4 z-50 bg-black/50 px-3 py-1 text-white text-xs rounded-md">
            Align barcode within the frame
          </div>

          <div id="reader" className="w-full h-full [&>div]:!border-0 [&_video]:object-cover" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
