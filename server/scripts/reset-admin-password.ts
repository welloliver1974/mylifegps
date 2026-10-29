#!/usr/bin/env tsx
/**
 * Script de Emergência para Recuperação e Redefinição de Senhas no Servidor / VPS
 *
 * Exemplos de uso:
 *   npx tsx scripts/reset-admin-password.ts
 *   npx tsx scripts/reset-admin-password.ts admin@email.com MinhaNovaSenha123
 *   npx tsx scripts/reset-admin-password.ts admin@email.com --code
 */
import { prisma } from '../src/db.js';
import { hashPassword } from '../src/services/auth.js';
import { generatePasswordResetCode, MIN_PASSWORD_LENGTH } from '../src/services/passwordReset.js';

async function main() {
  console.log('\n======================================================');
  console.log('   My Life360 - Recuperação de Senhas (CLI)');
  console.log('======================================================\n');

  const args = process.argv.slice(2);
  const emailArg = args[0]?.trim().toLowerCase();
  const passwordOrFlag = args[1]?.trim();

  // 1. Se nenhum argumento for passado, lista os usuários e gera código para o admin principal
  if (!emailArg) {
    const users = await prisma.user.findMany({
      where: { passwordHash: { not: null } },
      select: { id: true, name: true, email: true, role: true },
    });

    if (users.length === 0) {
      console.log('Nenhuma conta com senha configurada no banco de dados.');
      return;
    }

    console.log('Usuários com acesso ao painel:');
    users.forEach((u, i) => {
      console.log(`  [${i + 1}] ${u.name} (${u.email}) - Papel: ${u.role}`);
    });

    console.log('\nComo usar:');
    console.log('  1) Redefinir diretamente:');
    console.log(`     npm run reset-password ${users[0].email} NovaSenhaForte123\n`);
    console.log('  2) Gerar código de uso único para o app:');
    console.log(`     npm run reset-password ${users[0].email} --code\n`);

    // Gera um código de cortesia para o primeiro admin
    const firstAdmin = users.find((u) => u.role === 'admin') || users[0];
    const generated = await generatePasswordResetCode(firstAdmin.id, 'cli-auto');
    console.log(`🔑 Código de recuperação gerado para ${firstAdmin.name} (${firstAdmin.email}):`);
    console.log(`   👉 ${generated.code} 👈 (Válido por ${generated.validMinutes} minutos)`);
    console.log('   Insira este código na tela de "Esqueci minha senha" no app.\n');
    return;
  }

  // 2. Busca o usuário pelo e-mail
  const user = await prisma.user.findUnique({
    where: { email: emailArg },
  });

  if (!user) {
    console.error(`✘ Erro: Usuário com e-mail "${emailArg}" não encontrado no banco.`);
    process.exit(1);
  }

  // 3. Se pediu apenas código (--code)
  if (passwordOrFlag === '--code' || !passwordOrFlag) {
    const generated = await generatePasswordResetCode(user.id, 'cli');
    console.log(`✔ Código de recuperação gerado com sucesso para ${user.name} (${user.email}):`);
    console.log(`\n   Código: ${generated.code}`);
    console.log(`   Validade: ${generated.validMinutes} minutos (${generated.expiresAt.toLocaleTimeString('pt-BR')})\n`);
    console.log('Use na tela "Esqueci minha senha" para criar sua nova senha no app.\n');
    return;
  }

  // 4. Redefinição direta de senha
  const newPassword = passwordOrFlag;
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    console.error(`✘ Erro: A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Revoga sessões antigas por segurança
  const deleted = await prisma.authSession.deleteMany({
    where: { userId: user.id },
  });

  console.log(`✔ Senha de "${user.name}" (${user.email}) alterada com sucesso!`);
  console.log(`✔ ${deleted.count} sessão(ões) antiga(s) revogada(s) por segurança.`);
  console.log('Agora você pode fazer login no app com a nova senha.\n');
}

main()
  .catch((err) => {
    console.error('Erro ao executar reset de senha:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
