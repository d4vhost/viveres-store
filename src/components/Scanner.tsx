import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode("reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannerRef.current) {
              scannerRef.current.stop().then(() => {
                onScan(decodedText);
              });
            }
          },
          undefined // ignore frame errors
        );
      } catch (err: any) {
        setError('No se pudo acceder a la cámara. Por favor, da los permisos necesarios.');
        console.error(err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '40px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <h2 style={{ color: 'white', fontSize: '18px', margin: 0 }}>Escanear Código</h2>
        <button style={{ width: 'auto', padding: '6px 16px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '20px', fontSize: '15px' }} onClick={() => {
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current.stop().catch(console.error);
            }
            onClose();
        }}>
          Cancelar
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div id="reader" style={{ width: '100%', height: '100%' }}></div>
        
        {/* Custom Overlay (Laser line and corners) */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '250px', height: '250px', border: '2px solid rgba(255,255,255,0.3)', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', backgroundColor: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'scan 2s infinite linear' }}></div>
            {/* Corners */}
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '30px', height: '30px', borderTop: '4px solid white', borderLeft: '4px solid white', borderTopLeftRadius: '12px' }}></div>
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '30px', height: '30px', borderTop: '4px solid white', borderRight: '4px solid white', borderTopRightRadius: '12px' }}></div>
            <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '30px', height: '30px', borderBottom: '4px solid white', borderLeft: '4px solid white', borderBottomLeftRadius: '12px' }}></div>
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '30px', height: '30px', borderBottom: '4px solid white', borderRight: '4px solid white', borderBottomRightRadius: '12px' }}></div>
          </div>
        </div>

        {error && (
          <div style={{ position: 'absolute', backgroundColor: 'rgba(255,0,0,0.8)', color: 'white', padding: '16px', borderRadius: '8px', margin: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        #reader video { object-fit: cover; height: 100vh !important; }
      `}</style>
    </div>
  );
}
