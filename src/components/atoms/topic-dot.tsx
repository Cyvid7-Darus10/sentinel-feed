interface TopicDotProps {
  readonly color: string;
  readonly className?: string;
}

export function TopicDot({ color, className = 'h-2 w-2' }: TopicDotProps) {
  return (
    <span
      className={`inline-block ${className}`}
      style={{ background: color }}
    />
  );
}
