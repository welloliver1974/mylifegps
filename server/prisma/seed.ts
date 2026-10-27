import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: 'user-wellington-demo' },
    update: {},
    create: {
      id: 'user-wellington-demo',
      name: 'Wellington',
      color: '#3B82F6',
      devices: {
        create: {
          id: 'dev-wellington-phone',
          name: 'Galaxy S23 Wellington',
          deviceIdentifier: 'wellington-phone-01',
          apiKey: 'key-wellington-secret',
        },
      },
    },
  });

  const place = await prisma.place.upsert({
    where: { id: 'place-casa' },
    update: {},
    create: {
      id: 'place-casa',
      name: 'Casa',
      latitude: -23.55052,
      longitude: -46.633308,
      radiusMeters: 120.0,
      color: '#10B981',
      icon: 'home',
    },
  });

  console.log('Seed executado com sucesso:');
  console.log('Usuário:', user.name);
  console.log('Lugar:', place.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
