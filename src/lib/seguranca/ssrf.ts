import dns from 'dns';
import { isIP } from 'net';

/**
 * Verifica se um endereço IP é privado, loopback, link-local ou reservado.
 */
export function isPrivateIp(ip: string): boolean {
  if (!isIP(ip)) return true; // Se não for um IP válido, bloqueia por segurança

  if (isIP(ip) === 4) {
    if (ip.startsWith('127.')) return true; // Loopback
    if (ip.startsWith('10.')) return true; // Classe A Privada
    if (ip.startsWith('169.254.')) return true; // Link-local
    if (ip === '0.0.0.0') return true; // Endereço curinga local

    const parts = ip.split('.').map(Number);
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // Classe B Privada
    if (parts[0] === 192 && parts[1] === 168) return true; // Classe C Privada
  } else if (isIP(ip) === 6) {
    const normal = ip.toLowerCase();
    if (normal === '::1' || normal === '::') return true; // Loopback e Unspecified
    if (normal.startsWith('fe8') || normal.startsWith('fe9') || normal.startsWith('fea') || normal.startsWith('feb')) return true; // Link-local
    if (normal.startsWith('fc') || normal.startsWith('fd')) return true; // Unique Local Address (ULA)
  }

  return false;
}

/**
 * Valida se uma URL é segura para requisições de webhook (previne SSRF).
 */
export async function isSafeUrl(urlString: string): Promise<{ safe: boolean; error?: string }> {
  try {
    const url = new URL(urlString);

    // Permitir apenas HTTPS em produção
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return { safe: false, error: 'Apenas protocolo HTTPS e permitido em producao.' };
    }

    // Se não for HTTPS/HTTP, bloquear
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { safe: false, error: 'Protocolo invalido. Apenas HTTP/HTTPS sao permitidos.' };
    }

    const hostname = url.hostname;

    // Se o hostname for diretamente um IP, valida logo
    if (isIP(hostname)) {
      if (isPrivateIp(hostname)) {
        return { safe: false, error: 'IPs privados nao sao permitidos.' };
      }
      return { safe: true };
    }

    // Resolver DNS
    const addresses = await new Promise<string[]>((resolve, reject) => {
      dns.resolve(hostname, (err, resolvedAddresses) => {
        if (err) {
          // Se falhar a resolução normal, tenta lookup básico
          dns.lookup(hostname, { all: true }, (lookupErr, result) => {
            if (lookupErr) {
              reject(lookupErr);
            } else {
              resolve(result.map(r => r.address));
            }
          });
        } else {
          resolve(resolvedAddresses);
        }
      });
    });

    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        return { safe: false, error: 'O dominio informado resolve para um IP privado.' };
      }
    }

    return { safe: true };
  } catch (err: any) {
    return { safe: false, error: `Falha na validacao da URL: ${err.message}` };
  }
}
