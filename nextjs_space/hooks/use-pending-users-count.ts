
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function usePendingUsersCount() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      // Apenas buscar se o usuário for ADMIN
      if (!session?.user || session.user.role !== 'ADMIN') {
        setCount(0);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch('/api/users/approval/count');
        if (response.ok) {
          const data = await response.json();
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching pending users count:', error);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchCount, 30000);

    return () => clearInterval(interval);
  }, [session]);

  return { count, isLoading };
}
