

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getTranslation, Language } from '@/lib/i18n';

interface FolderModalProps {
  folder?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  onClose: () => void;
  onSaved: (folder: any) => void;
  language: Language;
}

const FOLDER_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
];

export function FolderModal({ folder, onClose, onSaved, language }: FolderModalProps) {
  const [name, setName] = useState(folder?.name || '');
  const [color, setColor] = useState(folder?.color || '#3B82F6');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    setIsLoading(true);

    try {
      const url = folder ? `/api/folders/${folder.id}` : '/api/folders';
      const method = folder ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) {
        throw new Error('Failed to save folder');
      }

      const savedFolder = await response.json();
      onSaved(savedFolder);
    } catch (error) {
      console.error('Save folder error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {folder 
              ? getTranslation('editFolder', language)
              : getTranslation('newFolder', language)
            }
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {getTranslation('folderName', language)}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                language === 'pt' ? 'Nome da pasta...' : 'Folder name...'
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>
              {language === 'pt' ? 'Cor' : 'Color'}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {FOLDER_COLORS.map((folderColor) => (
                <button
                  key={folderColor.value}
                  type="button"
                  onClick={() => setColor(folderColor.value)}
                  className={`h-10 rounded-md border-2 transition-all ${
                    color === folderColor.value
                      ? 'border-gray-900 scale-110'
                      : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: folderColor.value }}
                  title={folderColor.name}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {getTranslation('cancel', language)}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? (language === 'pt' ? 'A guardar...' : 'Saving...')
                : getTranslation('save', language)
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
