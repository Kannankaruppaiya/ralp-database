import { SearchResponse, SearchResultItem } from './search-engine';

export interface RAGSynthesisOutput {
  query: string;
  summary: string;
  keyMetrics: {
    matchedCohortSize: number;
    meanPsa: number;
    positiveMarginRatePercent: number;
    bcrAlertCount: number;
    overdueCount: number;
    bilateralNsRatePercent: number;
  };
  clinicalFindings: string[];
  actionableInsights: string[];
}

/**
 * Synthesizes structured clinical context from retrieved cohort into an executive medical summary.
 */
export function synthesizeClinicalRAG(searchResponse: SearchResponse): RAGSynthesisOutput {
  const { query, parsedQuery, results, totalMatches } = searchResponse;

  if (results.length === 0) {
    return {
      query,
      summary: `No patients found in the registry matching the clinical query "${query}". Try broadening your search or modifying specific Gleason, PSA, or stage criteria.`,
      keyMetrics: {
        matchedCohortSize: 0,
        meanPsa: 0,
        positiveMarginRatePercent: 0,
        bcrAlertCount: 0,
        overdueCount: 0,
        bilateralNsRatePercent: 0,
      },
      clinicalFindings: [],
      actionableInsights: ['Adjust search filters or search by patient NHS Number / Hospital MRN.'],
    };
  }

  // Calculate cohort aggregates
  let totalPsa = 0;
  let psaCount = 0;
  let positiveMargins = 0;
  let histologyCount = 0;
  let bcrAlerts = 0;
  let overdueFollowUps = 0;
  let bilateralNs = 0;
  let operationCount = 0;

  const stageCounts: Record<string, number> = {};
  const surgeonCounts: Record<string, number> = {};
  const gleasonCounts: Record<string, number> = {};

  for (const item of results) {
    const p = item.patient;

    // Surgeon
    surgeonCounts[p.primarySurgeon] = (surgeonCounts[p.primarySurgeon] ?? 0) + 1;

    // PSA
    if (p.baseline?.psa) {
      totalPsa += p.baseline.psa;
      psaCount++;
    }

    // Histology
    if (p.histology) {
      histologyCount++;
      if (p.histology.surgicalMargins?.includes('Positive') || p.histology.surgicalMargins === 'Positive (R1)') {
        positiveMargins++;
      }
      if (p.histology.pathologicalStage) {
        stageCounts[p.histology.pathologicalStage] = (stageCounts[p.histology.pathologicalStage] ?? 0) + 1;
      }
      if (p.histology.gleasonGrade) {
        gleasonCounts[p.histology.gleasonGrade] = (gleasonCounts[p.histology.gleasonGrade] ?? 0) + 1;
      }
    }

    // Operation
    if (p.operation) {
      operationCount++;
      if (p.operation.nerveSparing === 'Bilateral') {
        bilateralNs++;
      }
    }

    // Follow-ups
    if (p.followUps) {
      if (p.followUps.some((f) => f.biochemicalRecurrence || (f.psa !== undefined && f.psa >= 0.2))) {
        bcrAlerts++;
      }
      if (p.followUps.some((f) => f.status === 'overdue')) {
        overdueFollowUps++;
      }
    }
  }

  const meanPsa = psaCount > 0 ? Number((totalPsa / psaCount).toFixed(2)) : 0;
  const positiveMarginRatePercent =
    histologyCount > 0 ? Math.round((positiveMargins / histologyCount) * 100) : 0;
  const bilateralNsRatePercent =
    operationCount > 0 ? Math.round((bilateralNs / operationCount) * 100) : 0;

  // Build Clinical Findings
  const findings: string[] = [];

  const topStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0];
  if (topStage) {
    findings.push(`Predominant pathological stage is pT${topStage[0]} (${topStage[1]} of ${histologyCount} histology cases).`);
  }

  const topGleason = Object.entries(gleasonCounts).sort((a, b) => b[1] - a[1])[0];
  if (topGleason) {
    findings.push(`Most frequent histology Gleason score is ${topGleason[0]} (${topGleason[1]} cases).`);
  }

  findings.push(
    `Positive surgical margin (PSM) rate is ${positiveMarginRatePercent}% (${positiveMargins}/${histologyCount} cases).`
  );

  if (bilateralNsRatePercent > 0) {
    findings.push(`Bilateral nerve sparing preserved in ${bilateralNsRatePercent}% of operative cases.`);
  }

  // Build Actionable Insights
  const insights: string[] = [];

  if (bcrAlerts > 0) {
    insights.push(`🚨 ${bcrAlerts} patient(s) have active Biochemical Recurrence (PSA ≥ 0.2 ng/mL) requiring salvage therapy or secondary imaging consideration.`);
  }

  if (overdueFollowUps > 0) {
    insights.push(`⚠️ ${overdueFollowUps} patient(s) have overdue longitudinal milestones requiring follow-up scheduling.`);
  }

  if (positiveMargins > 0) {
    insights.push(`📋 ${positiveMargins} R1 positive margin case(s) identified for multidisciplinary team (MDT) surveillance.`);
  }

  if (insights.length === 0) {
    insights.push('✅ All patients in this cohort have compliant follow-up trajectories with stable oncological outcomes.');
  }

  // Executive Summary text
  const intentStr = parsedQuery.extractedIntents.length > 0
    ? ` (${parsedQuery.extractedIntents.join(', ')})`
    : '';

  const summary = `Identified ${totalMatches} patient(s) matching "${query}"${intentStr}. The cohort has a mean pre-operative PSA of ${meanPsa} ng/mL with a positive surgical margin rate of ${positiveMarginRatePercent}%. ${bcrAlerts > 0 ? `${bcrAlerts} case(s) exhibit biochemical recurrence signals.` : 'Zero active biochemical recurrence flags detected.'}`;

  return {
    query,
    summary,
    keyMetrics: {
      matchedCohortSize: totalMatches,
      meanPsa,
      positiveMarginRatePercent,
      bcrAlertCount: bcrAlerts,
      overdueCount: overdueFollowUps,
      bilateralNsRatePercent,
    },
    clinicalFindings: findings,
    actionableInsights: insights,
  };
}
