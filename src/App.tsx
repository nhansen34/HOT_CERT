import { useEffect, useMemo, useState } from "react";
import type { HotCertification, HotCertificationsData } from "./types";

const DATA_URL = "/data/hot-certifications.json";

function isHotCertificationsData(value: unknown): value is HotCertificationsData {
  if (typeof value !== "object" || value === null) return false;

  const data = value as Partial<HotCertificationsData>;
  return (
    (data.generatedAt === null || typeof data.generatedAt === "string") &&
    (data.windowStart === null || typeof data.windowStart === "string") &&
    (data.windowEnd === null || typeof data.windowEnd === "string") &&
    Array.isArray(data.certifications) &&
    data.certifications.every(isHotCertification)
  );
}

function isHotCertification(value: unknown): value is HotCertification {
  if (typeof value !== "object" || value === null) return false;

  const row = value as Partial<HotCertification>;
  return (
    typeof row.certificationId === "string" &&
    typeof row.certificationName === "string" &&
    typeof row.totalAssignments === "number" &&
    typeof row.uniqueContributors === "number" &&
    typeof row.averageAssignmentsPerDay === "number" &&
    typeof row.firstAssignmentDate === "string" &&
    typeof row.mostRecentAssignmentDate === "string"
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

export default function App() {
  const [data, setData] = useState<HotCertificationsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(DATA_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Could not load dashboard data (${response.status}).`);
        }

        const payload: unknown = await response.json();
        if (!isHotCertificationsData(payload)) {
          throw new Error("Dashboard data does not match the expected JSON format.");
        }

        setData(payload);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Could not load dashboard data.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadData();
    return () => controller.abort();
  }, []);

  const topCertifications = useMemo(
    () =>
      [...(data?.certifications ?? [])]
        .sort(
          (left, right) =>
            right.totalAssignments - left.totalAssignments ||
            left.certificationName.localeCompare(right.certificationName),
        )
        .slice(0, 50),
    [data],
  );

  const certifications = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase();

    return topCertifications
      .filter(
        (row) =>
          row.certificationId.toLocaleLowerCase().includes(searchTerm) ||
          row.certificationName.toLocaleLowerCase().includes(searchTerm),
      );
  }, [topCertifications, search]);

  const totalAssignments = topCertifications.reduce(
    (total, row) => total + row.totalAssignments,
    0,
  );
  const uniqueContributors = topCertifications.reduce(
    (total, row) => total + row.uniqueContributors,
    0,
  );
  const windowLabel =
    data?.windowStart && data.windowEnd
      ? `${formatDate(data.windowStart)} – ${formatDate(data.windowEnd)}`
      : "Last 60 days";

  return (
    <main className="dashboard">
      <header className="page-header">
        <div>
          <p className="eyebrow">CERTIFICATION TRACKER</p>
          <h1>Hot certifications</h1>
          <p className="subtitle">
            Standalone certifications ranked by contributor assignment volume.
          </p>
        </div>
        <div className="window-badge">
          <span className="status-dot" />
          {windowLabel}
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <strong>Dashboard data unavailable.</strong> {error} Check{" "}
          <code>public/data/hot-certifications.json</code>.
        </div>
      )}

      <section className="summary-grid" aria-label="Summary">
        <article className="summary-card">
          <span className="summary-label">Top certifications</span>
          <strong>{formatNumber(topCertifications.length)}</strong>
        </article>
        <article className="summary-card">
          <span className="summary-label">Assignments in top 50</span>
          <strong>{formatNumber(totalAssignments)}</strong>
        </article>
        <article className="summary-card">
          <span className="summary-label">Unique contributor counts*</span>
          <strong>{formatNumber(uniqueContributors)}</strong>
        </article>
        <article className="summary-card">
          <span className="summary-label">Data refreshed</span>
          <strong className="refresh-date">
            {data?.generatedAt ? formatDate(data.generatedAt) : "Not available"}
          </strong>
        </article>
      </section>

      <section className="table-card" aria-labelledby="table-heading">
        <div className="table-heading">
          <div>
            <h2 id="table-heading">Top certifications</h2>
            <p>Sorted by total assignments, highest first</p>
          </div>
          <label className="search">
            <span className="visually-hidden">Search certifications</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.75" />
              <path d="m13 13 4 4" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or ID"
            />
          </label>
        </div>

        {loading ? (
          <div className="table-message" role="status">Loading certification data…</div>
        ) : certifications.length === 0 ? (
          <div className="table-message">
            {error
              ? "No results to display until the data file is available."
              : search
                ? "No certifications match your search."
                : "No certification data yet. Add the latest data-api export to the public/data folder."}
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col" className="rank-column">#</th>
                  <th scope="col">Certification</th>
                  <th scope="col" className="numeric">Total assignments</th>
                  <th scope="col" className="numeric">Unique contributors</th>
                  <th scope="col" className="numeric">Avg. per day</th>
                  <th scope="col">First assigned</th>
                  <th scope="col">Most recent</th>
                </tr>
              </thead>
              <tbody>
                {certifications.map((row, index) => (
                  <tr key={row.certificationId}>
                    <td className="rank-column">{index + 1}</td>
                    <td>
                      <span className="cert-name">{row.certificationName}</span>
                      <span className="cert-id">{row.certificationId}</span>
                    </td>
                    <td className="numeric assignment-count">
                      {formatNumber(row.totalAssignments)}
                    </td>
                    <td className="numeric">{formatNumber(row.uniqueContributors)}</td>
                    <td className="numeric">
                      {formatNumber(row.averageAssignmentsPerDay, 2)}
                    </td>
                    <td>{formatDate(row.firstAssignmentDate)}</td>
                    <td>{formatDate(row.mostRecentAssignmentDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <footer className="table-footer">
          Showing {formatNumber(certifications.length)} of{" "}
          {formatNumber(topCertifications.length)} top certifications
        </footer>
      </section>
      <p className="footnote">
        *Contributor counts are summed across certifications and may include the same
        contributor more than once.
      </p>
    </main>
  );
}
