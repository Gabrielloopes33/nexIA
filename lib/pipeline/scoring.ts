import { ActivityType } from "@prisma/client";

/**
 * Impacto no lead score por tipo de atividade
 */
export const SCORE_IMPACT: Record<ActivityType, number> = {
  NOTE: 1,
  CALL: 5,
  EMAIL: 3,
  MEETING: 10,
  WHATSAPP: 2,
  INSTAGRAM: 2,
  STAGE_CHANGE: 5,
  TASK_CREATED: 2,
  TASK_COMPLETED: 5,
  DOCUMENT: 3,
  AUTOMATION: 0,
  SYSTEM: 0,
};

/**
 * Calcula o impacto no score baseado no tipo de atividade
 */
export function calculateScoreImpact(activityType: ActivityType): number {
  return SCORE_IMPACT[activityType] || 0;
}

/**
 * Calcula o novo lead score após uma atividade
 * @param currentScore Score atual (0-100)
 * @param activityType Tipo de atividade
 * @returns Novo score (limitado a 100)
 */
export function updateLeadScore(
  currentScore: number,
  activityType: ActivityType
): number {
  const impact = calculateScoreImpact(activityType);
  const newScore = Math.min(100, currentScore + impact);
  return Math.round(newScore);
}

/**
 * Calcula decay do impacto baseado na idade da atividade
 * - Atividades < 7 dias: 100% do impacto
 * - Atividades 7-30 dias: 50% do impacto
 * - Atividades > 30 dias: 0% do impacto
 */
export function calculateActivityDecay(
  activityDate: Date,
  impact: number
): number {
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(activityDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivity <= 7) {
    return impact;
  } else if (daysSinceActivity <= 30) {
    return impact * 0.5;
  } else {
    return 0;
  }
}

/**
 * Recalcula o lead score baseado em todas as atividades
 * Útil para recalcular scores após mudanças nas regras
 */
export function recalculateLeadScore(
  activities: Array<{ type: ActivityType; createdAt: Date }>
): number {
  let score = 0;

  for (const activity of activities) {
    const baseImpact = calculateScoreImpact(activity.type);
    const decayedImpact = calculateActivityDecay(activity.createdAt, baseImpact);
    score += decayedImpact;
  }

  return Math.min(100, Math.round(score));
}
