/**
 * Moteur de correction automatique des QCM
 * Gère les types : single_choice, multiple_choice, true_false, number
 */

export type AutoGradeResult = {
  score: number;          // Points obtenus
  maxScore: number;       // Points max possibles
  isCorrect: boolean;     // Réponse correcte ?
  isAutoGraded: boolean;  // A été corrigé automatiquement ?
  comment: string;        // Commentaire généré
};

/**
 * Normalise une chaîne pour la comparaison (minuscules, sans espaces superflus)
 */
function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Corrige automatiquement une question selon son type et la réponse du candidat.
 * Retourne null si le type ne peut pas être corrigé automatiquement (ex: long_text).
 */
export function autoGradeQuestion({
  kind,
  candidateAnswer,
  expectedAnswer,
  choices,
  points,
}: {
  kind: string;
  candidateAnswer: string | null | undefined;
  expectedAnswer: string | null | undefined;
  choices: string[];
  points: number;
}): AutoGradeResult | null {
  // Types non-corrigibles automatiquement (rédactionnel)
  if (
    kind === "long_text" ||
    kind === "short_text" ||
    kind === "text" ||
    !expectedAnswer
  ) {
    return null;
  }

  const answer = (candidateAnswer || "").trim();
  const expected = (expectedAnswer || "").trim();

  // Cas : pas de réponse du tout
  if (!answer) {
    return {
      score: 0,
      maxScore: points,
      isCorrect: false,
      isAutoGraded: true,
      comment: `Aucune réponse. Réponse attendue : « ${expected} ».`,
    };
  }

  // ─── CHOIX UNIQUE ─────────────────────────────────────────────
  if (kind === "single_choice") {
    const isCorrect = normalize(answer) === normalize(expected);
    return {
      score: isCorrect ? points : 0,
      maxScore: points,
      isCorrect,
      isAutoGraded: true,
      comment: isCorrect
        ? `Bonne réponse. ✓`
        : `Mauvaise réponse. Réponse sélectionnée : « ${answer} ». Réponse attendue : « ${expected} ».`,
    };
  }

  // ─── VRAI / FAUX ──────────────────────────────────────────────
  if (kind === "true_false") {
    const isCorrect = normalize(answer) === normalize(expected);
    return {
      score: isCorrect ? points : 0,
      maxScore: points,
      isCorrect,
      isAutoGraded: true,
      comment: isCorrect
        ? `Bonne réponse. ✓`
        : `Mauvaise réponse. Réponse sélectionnée : « ${answer} ». Réponse attendue : « ${expected} ».`,
    };
  }

  // ─── CHOIX MULTIPLES ─────────────────────────────────────────
  if (kind === "multiple_choice") {
    // Les réponses du candidat sont séparées par ";;"
    const candidateChoices = answer
      .split(";;")
      .map((c) => normalize(c))
      .filter(Boolean)
      .sort();

    // Les réponses attendues peuvent aussi être séparées par ";;" ou ","
    const expectedChoices = expected
      .split(/;;|,/)
      .map((c) => normalize(c))
      .filter(Boolean)
      .sort();

    const isCorrect =
      candidateChoices.length === expectedChoices.length &&
      candidateChoices.every((c, i) => c === expectedChoices[i]);

    // Score partiel : points proportionnels au nombre de bonnes réponses
    // on compte les choix cochés corrects moins les incorrects
    const correctlySelected = candidateChoices.filter((c) =>
      expectedChoices.includes(c)
    ).length;
    const incorrectlySelected = candidateChoices.filter(
      (c) => !expectedChoices.includes(c)
    ).length;

    // Score partiel (évite score négatif)
    const rawScore = correctlySelected - incorrectlySelected;
    const partialScore = Math.max(
      0,
      Math.round((rawScore / expectedChoices.length) * points * 10) / 10
    );

    return {
      score: partialScore,
      maxScore: points,
      isCorrect,
      isAutoGraded: true,
      comment: isCorrect
        ? `Toutes les bonnes réponses sélectionnées. ✓`
        : `Réponse incomplète ou incorrecte. Réponses attendues : « ${expectedChoices.join(", ")} ». Score partiel : ${partialScore}/${points}.`,
    };
  }

  // ─── VALEUR NUMÉRIQUE ────────────────────────────────────────
  if (kind === "number") {
    const candidateNum = parseFloat(answer.replace(",", "."));
    const expectedNum = parseFloat(expected.replace(",", "."));

    if (isNaN(candidateNum) || isNaN(expectedNum)) {
      return {
        score: 0,
        maxScore: points,
        isCorrect: false,
        isAutoGraded: true,
        comment: `Réponse numérique invalide. Réponse attendue : ${expected}.`,
      };
    }

    const isCorrect = Math.abs(candidateNum - expectedNum) < 0.001;
    return {
      score: isCorrect ? points : 0,
      maxScore: points,
      isCorrect,
      isAutoGraded: true,
      comment: isCorrect
        ? `Bonne réponse. ✓`
        : `Réponse incorrecte. Valeur saisie : ${candidateNum}. Valeur attendue : ${expectedNum}.`,
    };
  }

  return null;
}

/**
 * Corrige automatiquement l'ensemble des questions d'une tentative.
 * Retourne la liste des notes calculées + les questions non-corrigibles automatiquement.
 */
export function autoGradeAttempt({
  questions,
  answersMap,
}: {
  questions: {
    id: string;
    kind: string;
    points: number;
    choices: string[];
    expectedAnswer: string | null;
  }[];
  answersMap: Record<string, string>;
}): {
  autoGraded: { questionId: string; score: number; comment: string; isCorrect: boolean }[];
  manualRequired: string[]; // IDs des questions à corriger manuellement
} {
  const autoGraded: { questionId: string; score: number; comment: string; isCorrect: boolean }[] = [];
  const manualRequired: string[] = [];

  for (const q of questions) {
    const result = autoGradeQuestion({
      kind: q.kind,
      candidateAnswer: answersMap[q.id],
      expectedAnswer: q.expectedAnswer,
      choices: q.choices || [],
      points: q.points,
    });

    if (result) {
      autoGraded.push({
        questionId: q.id,
        score: result.score,
        comment: result.comment,
        isCorrect: result.isCorrect,
      });
    } else {
      manualRequired.push(q.id);
    }
  }

  return { autoGraded, manualRequired };
}
