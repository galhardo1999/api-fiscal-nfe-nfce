import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Provedor de armazenamento simulado (Object Storage Mock)
 * Grava arquivos localmente na pasta public/storage e retorna URLs públicas.
 */
export class StorageService {
  private static baseDir = join(process.cwd(), 'public', 'storage');

  private static garantirDiretorio(subdir: string) {
    const dir = join(this.baseDir, subdir);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Salva um arquivo XML no Storage
   * @returns URL pública do arquivo
   */
  public static salvarXml(id: string, xmlContent: string): string {
    const dir = this.garantirDiretorio('xml');
    const filePath = join(dir, `${id}.xml`);
    writeFileSync(filePath, xmlContent, 'utf-8');
    return `/storage/xml/${id}.xml`;
  }

  /**
   * Salva um arquivo PDF no Storage
   * @returns URL pública do arquivo
   */
  public static salvarPdf(id: string, pdfBuffer: Buffer): string {
    const dir = this.garantirDiretorio('pdf');
    const filePath = join(dir, `${id}.pdf`);
    writeFileSync(filePath, pdfBuffer);
    return `/storage/pdf/${id}.pdf`;
  }
}
