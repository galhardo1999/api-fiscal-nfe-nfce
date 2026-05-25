import * as forge from 'node-forge';

interface AtributoForge {
  name: string;
  value: string;
  shortName?: string;
}

export interface InformacoesCertificadoA1 {
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  document: string | null;
  commonName: string;
}

function obterAtributo(atributos: AtributoForge[], nome: string): string {
  const atributo = atributos.find((item) => item.name === nome || item.shortName === nome);
  return atributo?.value || '';
}

function extrairDocumento(atributos: AtributoForge[]): string | null {
  const serialNumber = obterAtributo(atributos, 'serialNumber');
  if (serialNumber) {
    const numeros = serialNumber.replace(/\D/g, '');
    if (numeros.length === 14 || numeros.length === 11) {
      return numeros;
    }
  }

  const commonName = obterAtributo(atributos, 'CN');
  const match = commonName.match(/(\d{14}|\d{11})/);
  return match?.[1] || null;
}

export function extrairInformacoesCertificadoA1(certificateBuffer: Buffer, password: string): InformacoesCertificadoA1 {
  try {
    const p12Der = certificateBuffer.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag]?.[0];
    if (!certBag?.cert) {
      throw new Error('Certificado nao encontrado no arquivo PKCS#12');
    }

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    if (!keyBag?.key) {
      throw new Error('Chave privada nao encontrada no arquivo PKCS#12');
    }

    const certificado = certBag.cert;
    const agora = new Date();
    if (certificado.validity.notAfter < agora) {
      throw new Error('Certificado expirado');
    }
    if (certificado.validity.notBefore > agora) {
      throw new Error('Certificado ainda nao e valido');
    }

    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificado));
    const md = forge.md.sha1.create();
    md.update(certDer.getBytes());

    const subjectAttributes = certificado.subject.attributes as AtributoForge[];
    const issuerAttributes = certificado.issuer.attributes as AtributoForge[];

    return {
      subject: subjectAttributes.map((atributo) => `${atributo.shortName || atributo.name}=${atributo.value}`).join(', '),
      issuer: issuerAttributes.map((atributo) => `${atributo.shortName || atributo.name}=${atributo.value}`).join(', '),
      serialNumber: certificado.serialNumber,
      validFrom: certificado.validity.notBefore.toISOString(),
      validTo: certificado.validity.notAfter.toISOString(),
      fingerprint: md.digest().toHex().toUpperCase(),
      document: extrairDocumento(subjectAttributes),
      commonName: obterAtributo(subjectAttributes, 'CN'),
    };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (
      mensagem.includes('Invalid password') ||
      mensagem.includes('PKCS#12 MAC could not be verified') ||
      mensagem.includes('Only 8, 16, 24, or 32 bits supported')
    ) {
      throw new Error('Senha do certificado incorreta');
    }

    if (mensagem.includes('Invalid PKCS#12') || mensagem.includes('Unparsed DER bytes remain after ASN.1 parsing')) {
      throw new Error('Arquivo de certificado invalido ou corrompido');
    }

    throw new Error(mensagem);
  }
}
