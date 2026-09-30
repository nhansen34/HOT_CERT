# Hot Certifications Dashboard

A React + Vite dashboard scaffold for tracking the most frequently assigned
standalone certifications.

## Run locally

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Load data-api results

The browser app reads `public/data/hot-certifications.json`. Export or transform
the data-api query results to this shape, then replace the starter file and
refresh the dashboard:

```json
{
  "generatedAt": "2026-09-30T18:00:00Z",
  "windowStart": "2026-08-01T18:00:00Z",
  "windowEnd": "2026-09-30T18:00:00Z",
  "certifications": [
    {
      "certificationId": "example-id",
      "certificationName": "Example certification",
      "totalAssignments": 120,
      "uniqueContributors": 95,
      "averageAssignmentsPerDay": 2,
      "firstAssignmentDate": "2026-08-02T11:30:00Z",
      "mostRecentAssignmentDate": "2026-09-29T16:12:00Z"
    }
  ]
}
```

Keep only certifications that meet the standalone/no-job-flow criteria in the
export. The dashboard sorts by total assignments, supports name/ID search, and
shows the requested assignment metrics. MCP credentials belong in the MCP
client configuration, not in this browser app.