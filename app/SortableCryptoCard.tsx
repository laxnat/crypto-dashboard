import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CryptoCard } from "./CryptoCard";
import type { CoinRate } from "./types";

interface SortableCryptoCardProps {
  coin: CoinRate;
}

export function SortableCryptoCard({ coin }: SortableCryptoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: coin.symbol,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CryptoCard coin={coin} isDragging={isDragging} />
    </div>
  );
}
