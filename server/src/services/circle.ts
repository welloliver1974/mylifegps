import crypto from 'crypto';
import { prisma } from '../db.js';

// Caracteres seguros e sem ambiguidade visual (sem 0, O, 1, I, L)
const SAFE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Gera um código de convite legível e seguro (ex: FAM-K7W2-9M4P)
 */
export function generateInviteCode(prefix = 'FAM'): string {
  const getChunk = (len: number) => {
    const bytes = crypto.randomBytes(len);
    let chunk = '';
    for (let i = 0; i < len; i++) {
      chunk += SAFE_CHARS[bytes[i] % SAFE_CHARS.length];
    }
    return chunk;
  };
  return `${prefix}-${getChunk(4)}-${getChunk(4)}`;
}

/**
 * Normaliza o código de convite para facilitar digitação (remove espaços e põe em maiúsculas)
 */
export function normalizeInviteCode(raw: string): string {
  return (raw || '').trim().toUpperCase();
}

/**
 * Garante que exista ao menos um círculo padrão ("Família")
 * e vincula usuários e lugares legados a ele para não quebrar compatibilidade.
 */
export async function ensureDefaultCircle() {
  let circle = await prisma.circle.findFirst({
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!circle) {
    const inviteCode = generateInviteCode();
    circle = await prisma.circle.create({
      data: {
        name: 'Família',
        inviteCode,
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });
  }

  // Vincula usuários existentes sem círculo a este círculo padrão
  const users = await prisma.user.findMany({
    include: {
      circleMembers: true,
    },
  });

  for (const user of users) {
    if (user.circleMembers.length === 0) {
      await prisma.circleMember.create({
        data: {
          circleId: circle.id,
          userId: user.id,
          roleInCircle: user.role === 'admin' ? 'admin' : 'member',
        },
      });
    }
  }

  // Vincula lugares existentes sem circleId
  await prisma.place.updateMany({
    where: { circleId: null },
    data: { circleId: circle.id },
  });

  return circle;
}

/**
 * Retorna o círculo ativo do usuário autenticado
 */
export async function getUserCircle(userId: string) {
  let membership = await prisma.circleMember.findFirst({
    where: { userId },
    include: {
      circle: {
        include: {
          members: {
            include: { user: true },
            orderBy: { joinedAt: 'asc' },
          },
        },
      },
    },
  });

  if (!membership) {
    // Se o usuário não tem círculo (ex: acabou de criar conta em setup inicial), auto-recupera
    const defaultCircle = await ensureDefaultCircle();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      membership = await prisma.circleMember.create({
        data: {
          circleId: defaultCircle.id,
          userId: user.id,
          roleInCircle: user.role === 'admin' ? 'admin' : 'member',
        },
        include: {
          circle: {
            include: {
              members: {
                include: { user: true },
                orderBy: { joinedAt: 'asc' },
              },
            },
          },
        },
      });
    }
  }

  return membership;
}

/**
 * Regenera o código de convite de um círculo (apenas admin)
 */
export async function regenerateCircleInviteCode(circleId: string, requestedByUserId: string) {
  const membership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: {
        circleId,
        userId: requestedByUserId,
      },
    },
  });

  if (!membership || membership.roleInCircle !== 'admin') {
    throw { status: 403, message: 'Apenas administradores do círculo podem gerar um novo código de convite.' };
  }

  const newCode = generateInviteCode();
  const updated = await prisma.circle.update({
    where: { id: circleId },
    data: { inviteCode: newCode },
  });

  return updated.inviteCode;
}

/**
 * Entra em um círculo usando o código de convite
 */
export async function joinCircleWithCode(userId: string, codeInput: string) {
  const cleanCode = normalizeInviteCode(codeInput);
  if (!cleanCode) {
    throw { status: 400, message: 'Informe o código de convite.' };
  }

  // Busca o círculo pelo código exato ou sem hífens
  let circle = await prisma.circle.findUnique({
    where: { inviteCode: cleanCode },
  });

  if (!circle) {
    // Tenta encontrar caso o usuário tenha omitido os hífens
    const allCircles = await prisma.circle.findMany();
    const match = allCircles.find(
      (c) => c.inviteCode.replace(/-/g, '') === cleanCode.replace(/-/g, '')
    );
    if (match) circle = match;
  }

  if (!circle) {
    throw { status: 404, message: 'Código de convite inválido ou não encontrado.' };
  }

  const existingMember = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: {
        circleId: circle.id,
        userId,
      },
    },
  });

  if (existingMember) {
    throw { status: 409, message: 'Você já faz parte deste círculo familiar.' };
  }

  const newMembership = await prisma.circleMember.create({
    data: {
      circleId: circle.id,
      userId,
      roleInCircle: 'member',
    },
    include: {
      circle: true,
    },
  });

  return newMembership.circle;
}

/**
 * Remove um membro do círculo (apenas admin)
 */
export async function removeMemberFromCircle(circleId: string, memberId: string, requestedByUserId: string) {
  const adminMembership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: {
        circleId,
        userId: requestedByUserId,
      },
    },
  });

  if (!adminMembership || adminMembership.roleInCircle !== 'admin') {
    throw { status: 403, message: 'Apenas administradores do círculo podem remover membros.' };
  }

  // Verifica se o alvo é membro
  const targetMembership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: {
        circleId,
        userId: memberId,
      },
    },
  });

  if (!targetMembership) {
    throw { status: 404, message: 'Membro não encontrado neste círculo.' };
  }

  // Se o próprio admin está tentando sair, verificar se há outro admin
  if (memberId === requestedByUserId) {
    const adminCount = await prisma.circleMember.count({
      where: {
        circleId,
        roleInCircle: 'admin',
      },
    });

    if (adminCount <= 1) {
      throw { status: 400, message: 'Você é o único administrador do círculo. Promova outro membro antes de sair.' };
    }
  }

  await prisma.circleMember.delete({
    where: {
      circleId_userId: {
        circleId,
        userId: memberId,
      },
    },
  });

  return { success: true };
}
