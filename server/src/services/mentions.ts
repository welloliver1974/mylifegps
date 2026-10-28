import { prisma } from '../db.js';

export interface ParsedMention {
  id: string;
  name: string;
}

/** Escapa caracteres especiais de regex mantendo acentos intactos. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve menções `@nome` do texto para membros reais do círculo.
 *
 * Casa pelo nome completo do membro (mais longo primeiro), de modo que
 * "@Maria Clara" não vire "@Maria" seguido de texto solto, e ignora o
 * próprio autor e nomes que não correspondem a ninguém.
 */
export async function resolveMentions(
  text: string,
  authorId?: string | null
): Promise<ParsedMention[]> {
  if (!text || !text.includes('@')) return [];

  const users = await prisma.user.findMany({
    select: { id: true, name: true },
  });
  if (users.length === 0) return [];

  // Nomes mais longos primeiro: evita que "@Ana" capture o começo de "@Ana Paula"
  const ordered = [...users]
    .filter((u) => u.name && u.name.trim().length > 0)
    .sort((a, b) => b.name.length - a.name.length);

  const resolved: ParsedMention[] = [];
  const seen = new Set<string>();

  for (const user of ordered) {
    // Nome pode ter espaços; aceita múltiplos espaços entre as palavras
    const namePattern = user.name
      .trim()
      .split(/\s+/)
      .map(escapeRegex)
      .join('\\s+');

    const pattern = new RegExp(`@${namePattern}(?![\\p{L}\\p{N}])`, 'iu');

    if (!pattern.test(text)) continue;
    if (authorId && user.id === authorId) continue;
    if (seen.has(user.id)) continue;

    seen.add(user.id);
    resolved.push({ id: user.id, name: user.name });
  }

  return resolved;
}
