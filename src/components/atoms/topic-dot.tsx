interface TopicDotProps {
  readonly color: string;
  /** Size/shape utilities, e.g. "h-2 w-2" or "h-1.5 w-1.5 rounded-full". */
  readonly className?: string;
}

/** A small solid swatch in a topic's color. */
export function TopicDot({ color, className = 'h-2 w-2' }: TopicDotProps) {
  return (
    <span
      className={`inline-block ${className}`}
      style={{ background: color }}
    />
  );
}
