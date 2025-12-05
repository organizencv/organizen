
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string | null;
      role: string;
      companyId: string;
      language: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string | null;
    role: string;
    companyId: string;
    language: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    companyId: string;
    language: string;
    image?: string | null;
  }
}
