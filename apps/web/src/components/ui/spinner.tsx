import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-gray-600 border-t-blue-500',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Spinner size="lg" />
      <span className="text-gray-400">{message}</span>
    </div>
  );
}
