import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CircleAlert,
  LoaderCircle,
  MessageSquareText,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAttemptReviewQueryKey,
  getGetCampaignRankingsQueryKey,
  getGetDashboardQueryKey,
  getListCampaignCandidatesQueryKey,
  useGetAttemptReview,
  useSaveAttemptGrades,
} from "@workspace/api-client-react";
import "./review.css";

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue. Réessayez.";
}

export default function ReviewPage() {
  const { attemptId = "" } = useParams<{ attemptId: string }>();
  const review = useGetAttemptReview(attemptId, {
    query: {
      enabled: !!attemptId,
      queryKey: getGetAttemptReviewQueryKey(attemptId),
    },
  });
  const save = useSaveAttemptGrades();
  const cache = useQueryClient();
  const [scores, setScores] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const questions = review.data?.questions ?? [];
  const maxScore = useMemo(
    () => questions.reduce((sum, question) => sum + question.points, 0),
    [questions],
  );
  const totalScore = useMemo(
    () =>
      questions.reduce((sum, question) => {
        const current = scores[question.id] ?? (question.score?.toString() ?? "");
        return sum + (current === "" ? 0 : Number(current));
      }, 0),
    [questions, scores],
  );
  const gradedCount = questions.filter(
    (question) => (scores[question.id] ?? question.score?.toString() ?? "") !== "",
  ).length;

  useEffect(() => {
    if (!review.data) return;
    setScores(
      Object.fromEntries(
        review.data.questions.map((question) => [
          question.id,
          question.score?.toString() ?? "",
        ]),
      ),
    );
    setComments(
      Object.fromEntries(
        review.data.questions.map((question) => [question.id, question.comment ?? ""]),
      ),
    );
  }, [review.data]);

  async function saveGrades(validate: boolean) {
    if (!review.data) return;
    if (validate && questions.some((question) => (scores[question.id] ?? "") === "")) {
      setNotice("Attribuez une note à chaque question avant de valider.");
      return;
    }
    setNotice("");
    try {
      await save.mutateAsync({
        attemptId,
        data: {
          validate,
          grades: questions
            .filter((question) => (scores[question.id] ?? "") !== "")
            .map((question) => ({
              questionId: question.id,
              score: Number(scores[question.id]),
              comment: comments[question.id] ?? "",
            })),
        },
      });
      await Promise.all([
        cache.invalidateQueries({ queryKey: getGetAttemptReviewQueryKey(attemptId) }),
        cache.invalidateQueries({
          queryKey: getListCampaignCandidatesQueryKey(review.data.campaignId),
        }),
        cache.invalidateQueries({
          queryKey: getGetCampaignRankingsQueryKey(review.data.campaignId),
        }),
        cache.invalidateQueries({ queryKey: getGetDashboardQueryKey() }),
      ]);
      setNotice(
        validate
          ? "Correction validée. Le score est maintenant pris en compte dans le classement."
          : "Correction enregistrée. Vous pourrez la reprendre avant validation.",
      );
    } catch (error) {
      setNotice(errorText(error));
    }
  }

  if (review.isLoading) {
    return (
      <div className="review-state">
        <LoaderCircle className="review-spin" size={22} />
        <span>Chargement de la copie…</span>
      </div>
    );
  }
  if (review.isError) {
    return (
      <section className="review-panel">
        <div className="review-error"><CircleAlert size={19} />{errorText(review.error)}</div>
        <button className="btn btn-secondary" onClick={() => void review.refetch()}>
          Réessayer
        </button>
      </section>
    );
  }
  if (!review.data) return null;

  const data = review.data;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  return (
    <div className="review-page">
      <Link href={`/campaigns/${data.campaignId}`} className="back-link">
        <ArrowLeft size={15} /> Retour à la campagne
      </Link>
      <div className="review-title-row">
        <div>
          <span className="section-kicker">CORRECTION · {data.submissionType === "automatic" ? "SOUMISSION AUTOMATIQUE" : "SOUMISSION CANDIDAT"}</span>
          <h1>{data.candidateName}</h1>
          <p>Évaluez chaque réponse, ajoutez un commentaire si nécessaire, puis validez la correction.</p>
        </div>
        <div className={`review-score ${data.validated ? "is-validated" : ""}`}>
          <span>{data.validated ? "Score validé" : "Score provisoire"}</span>
          <strong>{totalScore}<small> / {maxScore} pts</small></strong>
          <b>{percentage}%</b>
        </div>
      </div>
      {data.validated && (
        <div className="review-validated">
          <ShieldCheck size={17} /> Cette correction a été validée. Un nouvel enregistrement mettra à jour le classement.
        </div>
      )}
      {notice && <div className={`review-notice ${save.isError ? "has-error" : ""}`} role="status">{notice}</div>}
      <div className="review-meta">
        <span><CheckCheck size={15} /> {gradedCount} / {questions.length} questions notées</span>
        <span>Soumise le {new Date(data.submittedAt).toLocaleString("fr-FR")}</span>
      </div>
      <div className="review-question-list">
        {questions.map((question, index) => (
          <article className="review-question" key={question.id}>
            <div className="review-question-head">
              <span className="review-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <span className="section-kicker">{question.competency || "Évaluation"} · {question.points} pts</span>
                <h2>{question.prompt}</h2>
              </div>
            </div>
            <div className="review-answer">
              <span className="review-label">RÉPONSE DU CANDIDAT</span>
              <p>{question.answer?.trim() || <em>Aucune réponse enregistrée.</em>}</p>
            </div>
            {question.expectedAnswer && (
              <div className="review-expected">
                <span className="review-label">REPÈRE DE CORRECTION</span>
                <p>{question.expectedAnswer}</p>
              </div>
            )}
            <div className="review-grade-row">
              <label className="review-grade-field">
                <span>Note <small>(sur {question.points})</small></span>
                <input
                  aria-label={`Note sur ${question.points} pour la question ${index + 1}`}
                  type="number"
                  min="0"
                  max={question.points}
                  step="0.5"
                  value={scores[question.id] ?? ""}
                  onChange={(event) =>
                    setScores((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                />
              </label>
              <label className="review-comment-field">
                <span><MessageSquareText size={14} /> Commentaire <small>(facultatif)</small></span>
                <textarea
                  value={comments[question.id] ?? ""}
                  maxLength={2000}
                  rows={2}
                  placeholder="Précisez votre appréciation…"
                  onChange={(event) =>
                    setComments((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                />
              </label>
            </div>
          </article>
        ))}
      </div>
      <div className="review-actions">
        <span>Les notes sont enregistrées avant de figurer au classement.</span>
        <div>
          <button className="btn btn-secondary" disabled={save.isPending} onClick={() => void saveGrades(false)}>
            {save.isPending ? <LoaderCircle className="review-spin" size={15} /> : <Save size={15} />}
            Enregistrer
          </button>
          <button className="btn btn-primary" disabled={save.isPending || data.validated} onClick={() => void saveGrades(true)}>
            {save.isPending ? <LoaderCircle className="review-spin" size={15} /> : <Check size={15} />}
            Valider la correction
          </button>
        </div>
      </div>
    </div>
  );
}
