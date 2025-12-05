
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Cake, Loader2, PartyPopper } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BirthdayPerson {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  age: number;
  team: {
    id: string;
    name: string;
    department: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface BirthdaysData {
  count: number;
  birthdays: BirthdayPerson[];
}

export function BirthdaysTodayWidget() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BirthdaysData | null>(null);

  useEffect(() => {
    loadBirthdays();
  }, []);

  const loadBirthdays = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/birthday/today');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar aniversariantes');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error loading birthdays:', error);
      // Silenciar erro para não incomodar o usuário
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Aniversariantes do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.count === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Aniversariantes do Dia
          </CardTitle>
          <CardDescription>
            Nenhum aniversariante hoje
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'ADMIN': 'Administrador',
      'MANAGER': 'Gerente',
      'SUPERVISOR': 'Supervisor',
      'STAFF': 'Colaborador'
    };
    return labels[role] || role;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          Aniversariantes do Dia
          <PartyPopper className="h-5 w-5 text-primary ml-auto" />
        </CardTitle>
        <CardDescription>
          {data.count === 1 ? '1 pessoa' : `${data.count} pessoas`} fazendo aniversário hoje! 🎉
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.birthdays.map((person) => (
            <div
              key={person.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-colors"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={person.image || undefined} alt={person.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-base flex items-center gap-2">
                      {person.name}
                      <span className="text-xl">🎂</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {person.email}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {person.age} anos
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getRoleLabel(person.role)}
                  </Badge>
                  {person.team && (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {person.team.name}
                      </Badge>
                      {person.team.department && (
                        <Badge variant="outline" className="text-xs">
                          {person.team.department.name}
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-2 italic">
                  🎉 Deseje um feliz aniversário!
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
