import { NextRequest, NextResponse } from "next/server";
import { getCampaignById } from "@/actions/campaigns";
import { getCandidatesByCampaign } from "@/actions/candidates";
import { getCampaignRankings } from "@/actions/grading";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const campaign = await getCampaignById(campaignId);

    if (!campaign) {
      return new NextResponse("Campagne introuvable", { status: 404 });
    }

    const candidates = await getCandidatesByCampaign(campaignId);
    const rankings = await getCampaignRankings(campaignId);

    // Construction du fichier CSV
    const headers = [
      "Rang",
      "Nom complet",
      "Email",
      "Statut",
      "Score (%)",
      "Seuil Requis (%)",
      "Admissible",
      "Top Shortlist",
    ];

    const escapeCsv = (str: string | number | null | undefined) => {
      const val = str === null || str === undefined ? "" : String(str);
      return `"${val.replace(/"/g, '""')}"`;
    };

    const rows = candidates.map((c) => {
      const topEntry = rankings.topCandidates.find((tc) => tc.candidateId === c.id);
      const isEligible = (c.score ?? 0) >= campaign.passingScore;
      const rank = topEntry ? topEntry.rank : "-";
      const isInTop = topEntry ? "OUI" : "NON";

      return [
        escapeCsv(rank),
        escapeCsv(`${c.firstName} ${c.lastName}`),
        escapeCsv(c.email),
        escapeCsv(c.status),
        escapeCsv(c.score !== null ? `${c.score}%` : "Non évalué"),
        escapeCsv(`${campaign.passingScore}%`),
        escapeCsv(isEligible && c.score !== null ? "OUI" : "NON"),
        escapeCsv(isInTop),
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");

    const safeTitle = campaign.title.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `classement_${safeTitle}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return new NextResponse(`Erreur lors de la génération de l'export: ${message}`, {
      status: 500,
    });
  }
}
