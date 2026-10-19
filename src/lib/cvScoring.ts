// @ts-ignore
import pdfParse from "pdf-parse";

// Mots d'arrêt (stopwords) courants en français à ignorer dans l'analyse
const STOP_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "du", "de", "d", "et", "ou", "en", "dans",
  "par", "pour", "vers", "avec", "sans", "sous", "sur", "au", "aux", "ce", "cet",
  "cette", "ces", "son", "sa", "ses", "leur", "leurs", "qui", "que", "quoi", "dont",
  "où", "est", "sont", "être", "avoir", "fait", "faire", "plus", "très", "tout",
  "tous", "toute", "toutes", "nous", "vous", "ils", "elles", "afin", "ainsi", "alors",
  "comme", "mais", "donc", "or", "ni", "car", "aussi", "entre", "autre", "autres",
  "votre", "notre", "poste", "mission", "missions", "profil", "recherché", "candidat"
]);

/**
 * Normalise un texte (minuscules, sans accents)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s+#.]/g, " ");
}

/**
 * Extrait les mots-clés pertinents depuis les exigences du poste
 */
export function extractKeywords(requirementsText: string): string[] {
  const normalized = normalizeText(requirementsText);
  const rawWords = normalized.split(/\s+/).map((w) => w.trim()).filter((w) => w.length >= 3);

  const keywords: string[] = [];
  const seen = new Set<string>();

  for (const word of rawWords) {
    if (!STOP_WORDS.has(word) && !seen.has(word)) {
      seen.add(word);
      keywords.push(word);
    }
  }

  return keywords;
}

/**
 * Extrait le texte brut depuis une URL (Vercel Blob ou Data URL base64)
 */
export async function extractCvText(cvUrl: string): Promise<string> {
  try {
    let buffer: Buffer;

    if (cvUrl.startsWith("data:")) {
      const base64Index = cvUrl.indexOf(";base64,");
      if (base64Index !== -1) {
        const base64Content = cvUrl.slice(base64Index + 8);
        buffer = Buffer.from(base64Content, "base64");
      } else {
        return "";
      }
    } else {
      const response = await fetch(cvUrl);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Extraction PDF
    try {
      const parsed = await pdfParse(buffer);
      if (parsed && parsed.text && parsed.text.trim().length > 0) {
        return parsed.text;
      }
    } catch {
      // Si ce n'est pas un PDF ou échec du parser PDF, lecture brute textuelle
      return buffer.toString("utf-8");
    }

    return buffer.toString("utf-8");
  } catch (err) {
    console.error("[CvScoring] Erreur lecture CV :", err);
    return "";
  }
}

export interface ScoreResult {
  score: number; // 0 à 100
  matchedKeywords: string[];
  totalKeywords: number;
  summary: string;
}

/**
 * Analyse le CV et calcule un score de correspondance avec les exigences de l'offre
 */
export async function scoreCv({
  cvUrl,
  requirements,
  description = "",
}: {
  cvUrl: string;
  requirements: string;
  description?: string;
}): Promise<ScoreResult> {
  const cvText = await extractCvText(cvUrl);

  if (!cvText || cvText.trim().length < 20) {
    return {
      score: 10,
      matchedKeywords: [],
      totalKeywords: 0,
      summary: "CV non lisible ou format texte indisponible pour analyse automatique.",
    };
  }

  const normalizedCv = normalizeText(cvText);

  // Mots-clés recherchés
  const targetText = `${requirements} ${description}`;
  const keywords = extractKeywords(targetText);

  if (keywords.length === 0) {
    return {
      score: 50,
      matchedKeywords: [],
      totalKeywords: 0,
      summary: "Exigences du poste non définies : évaluation par défaut.",
    };
  }

  const matchedKeywords: string[] = [];
  for (const kw of keywords) {
    // Vérification du mot-clé dans le CV
    if (normalizedCv.includes(kw)) {
      matchedKeywords.push(kw);
    }
  }

  // Bonus diplôme et formation
  let bonus = 0;
  const diplomaKeywords = ["master", "licence", "bac+5", "bac+4", "bac+3", "ingenieur", "doctorat", "bts", "dut", "mba"];
  for (const d of diplomaKeywords) {
    if (normalizedCv.includes(d)) {
      bonus += 5;
      break; // Un seul bonus diplôme
    }
  }

  // Bonus expérience
  const expKeywords = ["ans d experience", "annees d experience", "experience professionnelle", "responsable", "manager", "chef de projet"];
  for (const e of expKeywords) {
    if (normalizedCv.includes(e)) {
      bonus += 5;
      break;
    }
  }

  const matchRatio = matchedKeywords.length / keywords.length;
  // Score de base calculé à 90% sur les mots-clés + 10% bonus
  const rawScore = Math.round(matchRatio * 90) + bonus;
  const finalScore = Math.min(100, Math.max(0, rawScore));

  let summary = "";
  if (finalScore >= 75) {
    summary = `Excellent profil : ${matchedKeywords.length}/${keywords.length} compétences et mots-clés identifiés. Correspondance très élevée avec le poste.`;
  } else if (finalScore >= 50) {
    summary = `Profil intéressant : ${matchedKeywords.length}/${keywords.length} mots-clés détectés. Adéquation moyenne avec les exigences.`;
  } else {
    summary = `Profil incomplet ou peu pertinent : seulement ${matchedKeywords.length}/${keywords.length} mots-clés trouvés dans le CV.`;
  }

  return {
    score: finalScore,
    matchedKeywords,
    totalKeywords: keywords.length,
    summary,
  };
}
