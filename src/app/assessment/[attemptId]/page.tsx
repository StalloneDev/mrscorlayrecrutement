import { getAttemptQuestionsAndAnswers } from "@/actions/assessments";
import { AssessmentClient } from "./AssessmentClient";

interface Props {
  params: Promise<{ attemptId: string }>;
}

export default async function AssessmentPage({ params }: Props) {
  const { attemptId } = await params;
  const data = await getAttemptQuestionsAndAnswers(attemptId);

  return (
    <AssessmentClient
      attemptId={data.attemptId}
      initialSecondsRemaining={data.secondsRemaining}
      initialAnswers={data.answers}
      questions={data.questions}
      candidateName={data.candidateName}
      companyName={data.companyName}
      campaignTitle={data.campaignTitle}
      submittedAt={data.submittedAt ? data.submittedAt.toISOString() : null}
    />
  );
}