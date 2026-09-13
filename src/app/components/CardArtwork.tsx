import { HandHeart, Heart, PenLine } from "lucide-react";
import "./card-artwork.css";

type ArtworkKind = "question" | "journal" | "devotion" | "prayer";

/** Layered paper illustrations, separate from the card's interactive content. */
export function CardArtwork({
  variant,
  className = "",
}: {
  variant: ArtworkKind;
  className?: string;
}) {
  return (
    <span
      className={`card-artwork card-artwork--${variant} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="card-artwork__wash" />
      <span className="card-artwork__scene">
        <span className="card-artwork__paper" />
        {variant === "question" ? (
          <span className="card-artwork__envelope">
            <i className="card-artwork__letter" />
            <i className="card-artwork__envelope-front" />
            <Heart
              className="card-artwork__seal"
              size={14}
              strokeWidth={1.7}
              focusable="false"
            />
          </span>
        ) : variant === "journal" ? (
          <span className="card-artwork__notebook">
            <i className="card-artwork__ruling" />
            <i className="card-artwork__bookmark" />
            <PenLine size={34} strokeWidth={1.5} focusable="false" />
          </span>
        ) : variant === "prayer" ? (
          <span className="card-artwork__prayer">
            <HandHeart size={30} strokeWidth={1.5} focusable="false" />
          </span>
        ) : (
          <span className="card-artwork__book">
            <i />
            <i />
            <b className="card-artwork__bookmark" />
          </span>
        )}
      </span>
    </span>
  );
}
