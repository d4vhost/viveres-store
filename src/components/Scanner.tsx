import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function Scanner({ onScan, onClose }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);

  // El callback se guarda en un ref para que la cámara no se reinicie
  // cada vez que el componente padre vuelve a renderizar.
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const scanner = new Html5Qrcode('reader');
    let cancelled = false;
    let handled = false;

    const started = scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          // Recuadro apaisado: los códigos de barras son más anchos que altos.
          qrbox: (viewWidth: number, viewHeight: number) => {
            const width = Math.max(120, Math.min(300, Math.floor(viewWidth * 0.8)));
            const height = Math.max(80, Math.min(Math.floor(width * 0.6), Math.floor(viewHeight * 0.6)));
            return { width, height };
          },
        },
        decodedText => {
          if (handled) return;
          handled = true;
          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              if (!cancelled) onScanRef.current(decodedText.trim());
            });
        },
        undefined, // los fallos de lectura por cuadro son normales
      )
      .catch(err => {
        console.error(err);
        if (!cancelled) {
          setError('No se pudo acceder a la cámara. Revisa los permisos del navegador (y que la página use https).');
        }
      });

    return () => {
      cancelled = true;
      // Si la cámara aún está arrancando, se espera a que termine antes de pararla.
      started.then(() => {
        if (scanner.isScanning) scanner.stop().catch(() => {});
      });
    };
  }, []);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(20px + env(safe-area-inset-top, 0px)) 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <h2 style={{ color: 'white', fontSize: '18px', margin: 0 }}>Escanear código</h2>
        <button
          style={{ width: 'auto', padding: '6px 16px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: '20px', fontSize: '15px' }}
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div id="reader" style={{ width: '100%', height: '100%' }}></div>

        {/* Guía visual: recuadro con esquinas y línea láser */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 'min(300px, 80vw)', aspectRatio: '5 / 3', border: '2px solid rgba(255,255,255,0.3)', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', backgroundColor: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', animation: 'scan 2s infinite linear' }}></div>
            <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '30px', height: '30px', borderTop: '4px solid white', borderLeft: '4px solid white', borderTopLeftRadius: '12px' }}></div>
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '30px', height: '30px', borderTop: '4px solid white', borderRight: '4px solid white', borderTopRightRadius: '12px' }}></div>
            <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '30px', height: '30px', borderBottom: '4px solid white', borderLeft: '4px solid white', borderBottomLeftRadius: '12px' }}></div>
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '30px', height: '30px', borderBottom: '4px solid white', borderRight: '4px solid white', borderBottomRightRadius: '12px' }}></div>
          </div>
        </div>

        {error && (
          <div style={{ position: 'absolute', backgroundColor: 'rgba(220,38,38,0.9)', color: 'white', padding: '16px', borderRadius: '8px', margin: '20px', textAlign: 'center' }}>
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
        #reader video { object-fit: cover; height: 100dvh !important; }
      `}</style>
    </div>
  );
}
