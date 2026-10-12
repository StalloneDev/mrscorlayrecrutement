import { getAttemptForReview } from "@/actions/grading";
import { ReviewClient } from "./ReviewClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  const data = await getAttemptForReview(id);

  return (
    <ReviewClient
      attemptId={data.attemptId}
      candidateId={data.candidateId}
      candidateName={data.candidateName}
      candidateEmail={data.candidateEmail}
      campaignId={data.campaignId}
      campaignTitle={data.campaignTitle}
      submissionType={data.submissionType}
      submittedAt={data.submittedAt}
      initialValidated={data.validated}
      questions={data.questions}
    />
  );
}