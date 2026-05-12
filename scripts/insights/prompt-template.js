/**
 * Builds a structured analysis prompt for a given page's data.json.
 * The prompt instructs the model to find specific types of findings
 * and return them as JSON blocks.
 */

function buildPrompt(slug, data) {
  const { meta, mapData, chartBlocks, tableData } = data;

  const stateValues = mapData?.states
    ? Object.entries(mapData.states)
        .filter(([, s]) => s.value != null)
        .map(([code, s]) => `${s.name}: ${s.value}`)
        .join('\n')
    : 'No state-level data available.';

  return `You are a data journalist analysing Indian government survey data for the dashboard page: "${meta.title}".

## Data Context
- Indicator: ${mapData?.indicator || 'N/A'}
- Unit: ${mapData?.unit || 'N/A'}
- National Average: ${mapData?.nationalAverage ?? 'N/A'}
- Survey: ${meta.source}
- Period: ${meta.surveyPeriod}

## State Values
${stateValues}

## Notes from Data Team
${(meta.notes || []).join('\n')}

---

Analyse this data and find exactly 5–7 insight blocks. Each block should cover ONE of:
1. Top outlier states (>1.5 standard deviations from the mean — quantify the deviation)
2. Regional clustering (North/South/East/West/Northeast patterns)
3. Gender dimension findings (if indicator has a gender split in the data above)
4. One counter-intuitive finding (wealthy state underperforming, or poor state outperforming expectations)
5. Policy-relevant comparison or cross-indicator observation

Rules:
- Every number you cite MUST come directly from the data provided above — no hallucination
- Cite exact state names and exact values from the data
- Each insight should be 2–4 sentences maximum
- Write in clear, direct journalistic prose — not academic
- Do NOT start every insight with "States like..." — vary your sentence structure

Return your response as a JSON array with this exact schema:
[
  {
    "id": 1,
    "text": "...",
    "type": "outlier | regional | gender | counter-intuitive | policy",
    "claims": [
      { "description": "...", "stateOrValue": "...", "verifiedFrom": "mapData.states.XX.value" }
    ]
  }
]

Return ONLY the JSON array. No preamble, no explanation.`;
}

module.exports = { buildPrompt };
