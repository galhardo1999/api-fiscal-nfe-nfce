import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ClientStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { isValidDocument } from '@/lib/document-formatter';

interface UsuarioAutenticado {
  id: string;
  name: string;
  email: string | null;
  document?: string;
  clientId?: string;
}

function validarStatusCliente(client: { status: ClientStatus } | null): void {
  if (!client) return;

  if (client.status === ClientStatus.BLOQUEADO || client.status === ClientStatus.CANCELADO) {
    throw new Error('Acesso negado. Sua empresa está com status bloqueado. Entre em contato com o suporte.');
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        document: { label: 'Document', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.document || !credentials?.password) {
          return null;
        }

        const { document, password } = credentials;
        let usuarioAutenticado: UsuarioAutenticado | null = null;
        let isAdmin = false;

        try {
          // Verificar se é um email
          if (document.includes('@')) {
            // Primeiro, buscar na tabela de administradores
            const admin = await prisma.admin.findUnique({
              where: { email: document },
            });

            if (admin && admin.active) {
              const isValidPassword = await verifyPassword(password, admin.password);
              if (isValidPassword) {
                usuarioAutenticado = {
                  id: admin.id,
                  name: admin.name,
                  email: admin.email,
                  document: admin.email,
                };
                isAdmin = true;
              }
            } else {
              // Se não encontrou admin, buscar na tabela de usuários
              const regularUser = await prisma.user.findUnique({
                where: { email: document },
                include: {
                  client: {
                    select: { status: true },
                  },
                }
              });

              if (regularUser && regularUser.active) {
                const isValidPassword = await verifyPassword(password, regularUser.password);
                if (isValidPassword) {
                  validarStatusCliente(regularUser.client);

                  usuarioAutenticado = {
                    id: regularUser.id,
                    name: regularUser.name,
                    email: regularUser.email || regularUser.document,
                    document: regularUser.document ?? undefined,
                    clientId: regularUser.clientId ?? undefined,
                  };
                  isAdmin = false;
                }
              }
            }
          } else {
            // Validar formato do documento
            if (!isValidDocument(document)) {
              return null;
            }

            // Buscar usuário por documento
            const regularUser = await prisma.user.findUnique({
              where: { document },
              include: {
                client: {
                  select: { status: true },
                },
              }
            });

            if (regularUser && regularUser.active) {
              const isValidPassword = await verifyPassword(password, regularUser.password);
              if (isValidPassword) {
                validarStatusCliente(regularUser.client);

                usuarioAutenticado = {
                  id: regularUser.id,
                  name: regularUser.name,
                  email: regularUser.email || regularUser.document,
                  document: regularUser.document ?? undefined,
                  clientId: regularUser.clientId ?? undefined,
                };
                isAdmin = false;
              }
            }
          }

          if (usuarioAutenticado) {
            return {
              id: usuarioAutenticado.id,
              name: usuarioAutenticado.name,
              email: usuarioAutenticado.email,
              document: usuarioAutenticado.document,
              isAdmin,
              clientId: usuarioAutenticado.clientId,
            };
          }

          return null;
        } catch (error) {
          console.error("Erro na autenticação:", error);
          // Re-throw erro para ser capturado pelo NextAuth e mostrado ao usuário
          if (error instanceof Error) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.document = user.document;
        token.isAdmin = user.isAdmin;
        token.clientId = user.clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.document = token.document;
        session.user.isAdmin = token.isAdmin;
        session.user.clientId = token.clientId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    // maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
