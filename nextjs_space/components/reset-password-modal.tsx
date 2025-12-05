
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react';
import { getTranslation, Language } from '@/lib/i18n';

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface ResetPasswordModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
  language: Language;
}

export function ResetPasswordModal({ user, onClose, onSuccess, language }: ResetPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const { toast } = useToast();

  const generateRandomPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
    setGeneratedPassword(newPassword);
    setShowPassword(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    toast({
      title: language === 'pt' ? 'Copiado!' : 'Copied!',
      description: language === 'pt' ? 'Senha copiada para a área de transferência' : 'Password copied to clipboard',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || password.length < 6) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: language === 'pt' ? 'A senha deve ter no mínimo 6 caracteres' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: language === 'pt' ? 'Senha redefinida' : 'Password reset',
          description: language === 'pt' 
            ? `Senha de ${user.name || user.email} foi redefinida com sucesso` 
            : `Password for ${user.name || user.email} has been reset successfully`,
        });
        onSuccess();
      } else {
        throw new Error(data.error || 'Failed to reset password');
      }
    } catch (error) {
      toast({
        title: language === 'pt' ? 'Erro' : 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'pt' ? 'Redefinir Senha' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            {language === 'pt' 
              ? `Redefinir senha para ${user.name || user.email} (${user.email})`
              : `Reset password for ${user.name || user.email} (${user.email})`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">
              {language === 'pt' ? 'Nova Senha' : 'New Password'}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'pt' ? 'Digite a nova senha' : 'Enter new password'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={generateRandomPassword}
                title={language === 'pt' ? 'Gerar senha aleatória' : 'Generate random password'}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {password && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={copyToClipboard}
                  title={language === 'pt' ? 'Copiar senha' : 'Copy password'}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'pt' 
                ? 'Mínimo 6 caracteres. Use o botão para gerar uma senha segura.'
                : 'Minimum 6 characters. Use the button to generate a secure password.'}
            </p>
          </div>

          {generatedPassword && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm font-medium text-yellow-800 mb-1">
                {language === 'pt' ? '⚠️ Atenção!' : '⚠️ Warning!'}
              </p>
              <p className="text-xs text-yellow-700">
                {language === 'pt' 
                  ? 'Certifique-se de copiar esta senha antes de fechar. O utilizador precisará dela para fazer login.'
                  : 'Make sure to copy this password before closing. The user will need it to log in.'}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {getTranslation('cancel', language)}
            </Button>
            <Button type="submit" disabled={isLoading || !password}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'pt' ? 'Redefinir Senha' : 'Reset Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
