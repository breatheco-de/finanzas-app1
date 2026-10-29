/**
 * El browser YA NO habla con la DB (Fase 3).
 * Usá Server Actions. Este módulo falla a propósito si alguien lo importa mal.
 */
export function createClient(): never {
  throw new Error(
    "createClient() del browser fue eliminado (Fase 3). " +
      "Usá una Server Action — la DB solo se toca en el servidor."
  );
}
