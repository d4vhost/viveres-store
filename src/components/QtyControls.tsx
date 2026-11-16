import { Minus, Plus } from 'lucide-react';

interface QtyControlsProps {
  qty: number;
  label: string;
  onChange: (delta: number) => void;
}

export default function QtyControls({ qty, label, onChange }: QtyControlsProps) {
  return (
    <div className="qty-controls qty-controls-compact">
      <button
        type="button"
        className="qty-btn"
        aria-label={`Quitar uno de ${label}`}
        disabled={qty === 0}
        onClick={() => onChange(-1)}
      >
        <Minus size={14} />
      </button>
      <span className="qty-val">{qty}</span>
      <button
        type="button"
        className="qty-btn"
        aria-label={`Agregar uno de ${label}`}
        onClick={() => onChange(1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
