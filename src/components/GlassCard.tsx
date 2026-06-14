import type { PropsWithChildren } from 'react';

type GlassCardProps = PropsWithChildren<{
  className?: string;
  as?: 'section' | 'article' | 'div';
}>;

export function GlassCard({ children, className = '', as: Component = 'section' }: GlassCardProps) {
  return <Component className={`glass ${className}`}>{children}</Component>;
}
