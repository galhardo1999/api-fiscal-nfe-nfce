'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documento, setDocumento] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro('');
    setCarregando(true);

    const callbackUrl = searchParams.get('callbackUrl') || '/painel';
    const resultado = await signIn('credentials', {
      document: documento,
      password: senha,
      redirect: false,
      callbackUrl,
    });

    if (!resultado || resultado.error) {
      setCarregando(false);
      setErro('Documento/e-mail ou senha invalidos.');
      return;
    }

    router.push(resultado.url || callbackUrl);
    router.refresh();
  }

  return (
    <form className="form" onSubmit={entrar}>
      {erro ? <div className="alert error">{erro}</div> : null}
      <div className="field">
        <label htmlFor="document">E-mail ou documento</label>
        <input
          id="document"
          className="input"
          value={documento}
          onChange={(event) => setDocumento(event.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          className="input"
          type="password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      <button 
        className={`button primary ${carregando ? 'loading' : ''}`} 
        type="submit" 
        disabled={carregando}
      >
        {carregando ? <span className="spinner" aria-hidden="true" /> : 'Entrar'}
      </button>
    </form>
  );
}
