interface AvatarProps {
  nombre: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export function Avatar({ nombre, size = 'md', className = '' }: AvatarProps) {
  const initials = nombre
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white font-bold
        ${sizes[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
