
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Share2, Check, Mail, Link as LinkIcon, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';
import Image from 'next/image';

interface ShareButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
  showLabel?: boolean;
  language?: 'pt' | 'en' | 'es' | 'fr';
}

export function ShareButton({ 
  variant = 'ghost', 
  className = '', 
  showLabel = true,
  language = 'pt' 
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://organizen-4nwgfn.abacusai.app';

  const shareMessage = {
    pt: 'Estou usando o OrganiZen para gestão da minha equipa. Confira!',
    en: 'I am using OrganiZen for team management. Check it out!',
    es: 'Estoy usando OrganiZen para la gestión de mi equipo. ¡Échale un vistazo!',
    fr: 'J\'utilise OrganiZen pour la gestion de mon équipe. Découvrez-le!'
  };

  const message = shareMessage[language];
  const shareText = `${message}\n\n${appUrl}`;

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'OrganiZen',
          text: message,
          url: appUrl,
        });
        toast.success(language === 'pt' ? 'Partilhado com sucesso!' : 'Shared successfully!');
        setIsOpen(false);
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success(language === 'pt' ? 'Link copiado!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error(language === 'pt' ? 'Erro ao copiar link' : 'Error copying link');
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: '/whatsapp-icon.svg',
      url: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      color: '#25D366'
    },
    {
      name: 'Email',
      icon: <Mail className="w-6 h-6" />,
      url: `mailto:?subject=${encodeURIComponent('OrganiZen')}&body=${encodeURIComponent(shareText)}`,
      color: '#EA4335'
    },
    {
      name: 'LinkedIn',
      icon: '/linkedin-icon.svg',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`,
      color: '#0A66C2'
    },
    {
      name: 'Twitter/X',
      icon: '/twitter-icon.svg',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(appUrl)}`,
      color: '#1DA1F2'
    },
  ];

  return (
    <>
      <Button
        variant={variant}
        onClick={() => setIsOpen(true)}
        className={`${showLabel ? 'justify-start gap-3' : 'w-full'} ${className}`}
      >
        <Share2 className="h-5 w-5" />
        {showLabel && (language === 'pt' ? 'Partilhar' : 'Share')}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'pt' ? 'Partilhar OrganiZen' : 'Share OrganiZen'}
            </DialogTitle>
            <DialogDescription>
              {language === 'pt' 
                ? 'Partilhe o OrganiZen com a sua equipa ou colegas'
                : 'Share OrganiZen with your team or colleagues'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Native Share (mobile) */}
            {typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleNativeShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {language === 'pt' ? 'Partilhar via...' : 'Share via...'}
              </Button>
            )}

            {/* Copy Link */}
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg text-sm truncate">
                {appUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors group"
                  onClick={() => {
                    toast.success(
                      language === 'pt' 
                        ? `Abrindo ${option.name}...` 
                        : `Opening ${option.name}...`
                    );
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${option.color}15` }}
                  >
                    {typeof option.icon === 'string' ? (
                      <span className="text-2xl">{getIconEmoji(option.name)}</span>
                    ) : (
                      <div style={{ color: option.color }}>
                        {option.icon}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-center">{option.name}</span>
                </a>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to get emoji icons
function getIconEmoji(name: string) {
  switch (name) {
    case 'WhatsApp':
      return '💬';
    case 'LinkedIn':
      return '💼';
    case 'Twitter/X':
      return '🐦';
    default:
      return '📤';
  }
}
