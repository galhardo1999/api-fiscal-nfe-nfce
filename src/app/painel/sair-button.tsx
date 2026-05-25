'use client';

import { signOut } from 'next-auth/react';

export function SairButton() {
  return (
    <button className="button" type="button" onClick={() => signOut({ callbackUrl: '/login' })}>
      Sair
    </button>
  );
}
