import bcrypt from 'bcryptjs';

// Hash da senha - apenas para Node.js runtime
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verificar senha - apenas para Node.js runtime
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}