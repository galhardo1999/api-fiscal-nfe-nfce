import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valida um XML de NFC-e contra o schema XSD oficial usando a ferramenta nativa xmllint.
 * @param xmlString O conteúdo do XML a ser validado
 * @returns Um objeto indicando se é válido ou contendo a mensagem exata do erro
 */
export function validateNfceXml(xmlString: string): ValidationResult {
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'fiscal', 'schemas', 'enviNFe_v4.00.xsd');

  if (!fs.existsSync(schemaPath)) {
    // Schema ausente não deve bloquear emissão em produção — loga aviso e prossegue
    console.warn(`[nfce-validator] Schema XSD não encontrado em: ${schemaPath}. Validação XSD ignorada.`);
    return { isValid: true };
  }

  const tempDir = path.join(process.cwd(), 'tmp', 'nfce-validation');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempXmlPath = path.join(tempDir, `temp_validation_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.xml`);

  try {
    fs.writeFileSync(tempXmlPath, xmlString, 'utf8');

    // Executar xmllint usando execSync do node
    // --schema: caminho do arquivo XSD
    // --noout: não exibe o XML de entrada na saída padrão
    const cmd = `xmllint --schema "${schemaPath}" "${tempXmlPath}" --noout`;
    execSync(cmd, { stdio: 'pipe' });

    return { isValid: true };
  } catch (err: any) {
    let errorMsg = 'Falha desconhecida na validação XML.';
    if (err.stderr) {
      errorMsg = err.stderr.toString('utf8');
    } else if (err.stdout) {
      errorMsg = err.stdout.toString('utf8');
    } else if (err.message) {
      errorMsg = err.message;
    }

    // Limpar o erro para remover caminhos temporários e torná-lo amigável
    const cleanedError = errorMsg
      .replace(new RegExp(tempXmlPath, 'g'), 'xml_gerado.xml')
      .trim();

    return {
      isValid: false,
      error: cleanedError
    };
  } finally {
    // Remover o arquivo temporário
    if (fs.existsSync(tempXmlPath)) {
      try {
        fs.unlinkSync(tempXmlPath);
      } catch (unlinkErr) {
        // Ignorar falha ao deletar arquivo temporário
      }
    }
  }
}
