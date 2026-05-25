import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      document?: string;
      isAdmin: boolean;
      clientId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    document?: string;
    isAdmin: boolean;
    clientId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    document?: string;
    isAdmin: boolean;
    clientId?: string;
  }
}
