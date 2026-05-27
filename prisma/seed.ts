import { AdminRole, BillingPeriod, ClientStatus, PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const emailAdmin = process.env.SEED_ADMIN_EMAIL || 'admin@apifiscal.local';
const senhaAdmin = process.env.SEED_ADMIN_PASSWORD;
if (!senhaAdmin && isProduction) {
  throw new Error('A variavel de ambiente SEED_ADMIN_PASSWORD e obrigatoria em producao para evitar credenciais padrao.');
}
const emailUsuarioCliente = process.env.SEED_CLIENTE_EMAIL || 'cliente@apifiscal.local';
const senhaUsuarioCliente = process.env.SEED_CLIENTE_PASSWORD;
if (!senhaUsuarioCliente && isProduction) {
  throw new Error('A variavel de ambiente SEED_CLIENTE_PASSWORD e obrigatoria em producao para evitar credenciais padrao.');
}

const finalSenhaAdmin = senhaAdmin || 'Admin@123456';
const finalSenhaUsuarioCliente = senhaUsuarioCliente || 'Cliente@123456';

async function principal() {
  const senhaAdminHash = await hashPassword(finalSenhaAdmin);
  const senhaUsuarioClienteHash = await hashPassword(finalSenhaUsuarioCliente);

  const admin = await prisma.admin.upsert({
    where: { email: emailAdmin },
    update: {
      name: 'Administrador API Fiscal',
      password: senhaAdminHash,
      role: AdminRole.SUPER_ADMIN,
      active: true,
    },
    create: {
      name: 'Administrador API Fiscal',
      email: emailAdmin,
      password: senhaAdminHash,
      role: AdminRole.SUPER_ADMIN,
      active: true,
    },
  });

  const plano = await prisma.planos.upsert({
    where: { id: 'plano_api_fiscal_base' },
    update: {
      name: 'API Fiscal Base',
      description: 'Plano base para emissao de NF-e e NFC-e por API.',
      price: '69.90',
      billingPeriod: BillingPeriod.MENSAL,
      trialDays: 0,
      features: [
        'NF-e modelo 55',
        'NFC-e modelo 65',
        'Chaves de homologacao e producao',
        'Webhooks',
        'Cobranca por nota emitida',
      ],
      menuItems: ['chaves-api', 'empresas', 'documentos', 'webhooks', 'cobranca'],
      active: true,
    },
    create: {
      id: 'plano_api_fiscal_base',
      name: 'API Fiscal Base',
      description: 'Plano base para emissao de NF-e e NFC-e por API.',
      price: '69.90',
      billingPeriod: BillingPeriod.MENSAL,
      trialDays: 0,
      features: [
        'NF-e modelo 55',
        'NFC-e modelo 65',
        'Chaves de homologacao e producao',
        'Webhooks',
        'Cobranca por nota emitida',
      ],
      menuItems: ['chaves-api', 'empresas', 'documentos', 'webhooks', 'cobranca'],
      active: true,
    },
  });

  const cliente = await prisma.client.upsert({
    where: { email: 'contratante@apifiscal.local' },
    update: {
      companyName: 'Cliente Demonstracao API Fiscal',
      tradeName: 'Cliente API Fiscal',
      document: '00000000000191',
      status: ClientStatus.ATIVO,
      planId: plano.id,
    },
    create: {
      code: 'CLI-0001',
      companyName: 'Cliente Demonstracao API Fiscal',
      tradeName: 'Cliente API Fiscal',
      document: '00000000000191',
      email: 'contratante@apifiscal.local',
      phone: '(11) 4000-0000',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01001000',
      status: ClientStatus.ATIVO,
      createdById: admin.id,
      planId: plano.id,
    },
  });

  await prisma.user.upsert({
    where: { email: emailUsuarioCliente },
    update: {
      name: 'Usuario Cliente API Fiscal',
      password: senhaUsuarioClienteHash,
      active: true,
      clientId: cliente.id,
    },
    create: {
      name: 'Usuario Cliente API Fiscal',
      email: emailUsuarioCliente,
      document: '00000000000',
      password: senhaUsuarioClienteHash,
      active: true,
      clientId: cliente.id,
    },
  });

  console.log('Seed concluido.');
  console.log(`Admin: ${emailAdmin}`);
  console.log(`Usuario cliente: ${emailUsuarioCliente}`);
  console.log('Use as variaveis SEED_ADMIN_PASSWORD e SEED_CLIENTE_PASSWORD para trocar as senhas padrao.');
}

principal()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
