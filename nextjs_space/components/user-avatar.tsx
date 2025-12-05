
'use client';

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface UserAvatarProps {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  publicMode?: boolean; // Quando true, não tenta buscar foto via API (para uso em páginas públicas como login)
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg'
};

export function UserAvatar({ user, size = 'md', className = '', publicMode = false }: UserAvatarProps) {
  // Gerar iniciais do nome ou email
  const getInitials = () => {
    if (user?.name) {
      const names = user.name.trim().split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Gerar cor de fundo baseada no nome/email
  const getBackgroundColor = () => {
    const str = user?.name || user?.email || 'default';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Construir URL da imagem se existir
  // Em modo público (ex: página de login), não fazer requisições à API
  const imageUrl = !publicMode && user?.image && user?.id 
    ? `/api/profile/photo/url?userId=${user.id}` 
    : null;

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {imageUrl && (
        <AvatarImage 
          src={imageUrl} 
          alt={user?.name || user?.email || 'Avatar'}
        />
      )}
      <AvatarFallback 
        style={{ backgroundColor: getBackgroundColor() }}
        className="text-white font-semibold"
      >
        {user ? getInitials() : <User className="h-1/2 w-1/2" />}
      </AvatarFallback>
    </Avatar>
  );
}
