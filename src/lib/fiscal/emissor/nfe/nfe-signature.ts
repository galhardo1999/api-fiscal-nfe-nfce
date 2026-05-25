import * as forge from 'node-forge';

interface SignXmlParams {
  xmlString: string;
  p12Buffer: Buffer;
  password?: string;
  chaveAcesso: string;
}

/** Extrai chave privada e certificado de um buffer PKCS#12 */
function extractP12(p12Buffer: Buffer, password: string): { privateKey: forge.pki.PrivateKey; certificate: forge.pki.Certificate } {
  const p12Copy = Buffer.from(p12Buffer);
  try {
    const p12Der = p12Copy.toString('binary');
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    if (!keyBag?.key) throw new Error('Chave privada não encontrada no arquivo PKCS#12');

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag]?.[0];
    if (!certBag?.cert) throw new Error('Certificado não encontrado no arquivo PKCS#12');

    return { privateKey: keyBag.key as forge.pki.PrivateKey, certificate: certBag.cert };
  } finally {
    p12Copy.fill(0);
  }
}

/**
 * Assina digitalmente o XML da NF-e com o certificado A1 fornecido
 */
export function signNFeXml(params: SignXmlParams): string {
  const { xmlString, p12Buffer, password, chaveAcesso } = params;

  try {
    const { privateKey, certificate } = extractP12(p12Buffer, password || '');

    // Converter certificado para base64 DER
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate));
    const x509CertificateB64 = forge.util.encode64(certDer.getBytes());

    const modelo = chaveAcesso.substring(20, 22);
    let xmlTagPrefix = 'NFe';
    let ns = 'http://www.portalfiscal.inf.br/nfe';
    if (modelo === '75') {
      xmlTagPrefix = 'NFAg';
      ns = 'http://www.portalfiscal.inf.br/NFAg';
    } else if (modelo === '76') {
      xmlTagPrefix = 'NFGas';
      ns = 'http://www.portalfiscal.inf.br/NFGas';
    }

    // 2. Extrair o conteúdo exato de <inf[xmlTagPrefix] ...>...</inf[xmlTagPrefix]> do XML gerado
    const infRegex = new RegExp(`<inf${xmlTagPrefix}[\\s\\S]*?<\\/inf${xmlTagPrefix}>`);
    const match = xmlString.match(infRegex);
    if (!match) {
      throw new Error(`Elemento <inf${xmlTagPrefix}> não encontrado no XML`);
    }
    let infNFeContent = match[0];

    // Injetar o namespace na tag infNFe para coincidir com a canonicalização (C14N) da SEFAZ
    if (!infNFeContent.includes('xmlns=')) {
      infNFeContent = infNFeContent.replace(
        `<inf${xmlTagPrefix}`,
        `<inf${xmlTagPrefix} xmlns="${ns}"`
      );
    }

    // 3. Calcular DigestValue (SHA-1) sobre a tag de informações
    const mdDigest = forge.md.sha1.create();
    mdDigest.update(infNFeContent, 'utf8');
    const digestValueB64 = forge.util.encode64(mdDigest.digest().getBytes());

    // 4. Construir o elemento <SignedInfo> exatamente como exigido pela SEFAZ
    const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
      `<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>` +
      `<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>` +
      `<Reference URI="#${xmlTagPrefix}${chaveAcesso}">` +
      `<Transforms>` +
      `<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>` +
      `<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform>` +
      `</Transforms>` +
      `<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>` +
      `<DigestValue>${digestValueB64}</DigestValue>` +
      `</Reference>` +
      `</SignedInfo>`;

    // 5. Assinar o bloco <SignedInfo> usando RSA-SHA-1
    const mdSig = forge.md.sha1.create();
    mdSig.update(signedInfo, 'utf8');
    const signatureBytes = (privateKey as any).sign(mdSig);
    const signatureValueB64 = forge.util.encode64(signatureBytes);

    // 6. Montar o bloco completo da <Signature>
    const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
      signedInfo +
      `<SignatureValue>${signatureValueB64}</SignatureValue>` +
      `<KeyInfo>` +
      `<X509Data>` +
      `<X509Certificate>${x509CertificateB64}</X509Certificate>` +
      `</X509Data>` +
      `</KeyInfo>` +
      `</Signature>`;

    // 7. Inserir a <Signature> imediatamente antes da tag de fechamento do documento
    const signedXml = xmlString.replace(`</${xmlTagPrefix}>`, `${signatureBlock}</${xmlTagPrefix}>`);
    return signedXml;

  } catch (error) {
    console.error('Erro na assinatura do XML da NFe:', error);
    throw new Error(`Erro na assinatura digital: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface SignEventXmlParams {
  xmlString: string;
  p12Buffer: Buffer;
  password?: string;
  eventId: string;
}

/**
 * Assina digitalmente o XML de um evento NF-e (cancelamento, CC-e, etc.)
 */
export function signEventXml(params: SignEventXmlParams): string {
  const { xmlString, p12Buffer, password, eventId } = params;

  try {
    const { privateKey, certificate } = extractP12(p12Buffer, password || '');

    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate));
    const x509CertificateB64 = forge.util.encode64(certDer.getBytes());

    const infRegex = /<infEvento[\s\S]*?<\/infEvento>/;
    const match = xmlString.match(infRegex);
    if (!match) throw new Error('Elemento <infEvento> não encontrado no XML');
    let infContent = match[0];

    if (!infContent.includes('xmlns=')) {
      infContent = infContent.replace('<infEvento', '<infEvento xmlns="http://www.portalfiscal.inf.br/nfe"');
    }

    const mdDigest = forge.md.sha1.create();
    mdDigest.update(infContent, 'utf8');
    const digestValueB64 = forge.util.encode64(mdDigest.digest().getBytes());

    const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
      `<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>` +
      `<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>` +
      `<Reference URI="#${eventId}">` +
      `<Transforms>` +
      `<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>` +
      `<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform>` +
      `</Transforms>` +
      `<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>` +
      `<DigestValue>${digestValueB64}</DigestValue>` +
      `</Reference>` +
      `</SignedInfo>`;

    const mdSig = forge.md.sha1.create();
    mdSig.update(signedInfo, 'utf8');
    const signatureBytes = (privateKey as any).sign(mdSig);
    const signatureValueB64 = forge.util.encode64(signatureBytes);

    const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
      signedInfo +
      `<SignatureValue>${signatureValueB64}</SignatureValue>` +
      `<KeyInfo>` +
      `<X509Data>` +
      `<X509Certificate>${x509CertificateB64}</X509Certificate>` +
      `</X509Data>` +
      `</KeyInfo>` +
      `</Signature>`;

    return xmlString.replace('</evento>', `${signatureBlock}</evento>`);

  } catch (error) {
    console.error('Erro na assinatura do XML do Evento:', error);
    throw new Error(`Erro na assinatura do evento: ${error instanceof Error ? error.message : String(error)}`);
  }
}
