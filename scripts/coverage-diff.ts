export interface FileCoverage {
  linesFound: number;
  linesHit: number;
}

export type CoverageMap = Record<string, FileCoverage>;

export interface PackageCoverage {
  name: string;
  base: CoverageMap;
  head: CoverageMap;
}

/**
 * Parse lcov content into a map of file path -> coverage data.
 * Optionally strips a path prefix from SF entries for normalization.
 */
export function parseLcov(content: string, stripPrefix?: string): CoverageMap {
  const result: CoverageMap = {};
  let currentFile: string | null = null;
  let linesFound = 0;
  let linesHit = 0;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (trimmed.startsWith("SF:")) {
      let filePath = trimmed.slice(3);
      if (stripPrefix && filePath.startsWith(stripPrefix)) {
        filePath = filePath.slice(stripPrefix.length);
      }
      currentFile = filePath;
      linesFound = 0;
      linesHit = 0;
    } else if (trimmed.startsWith("LF:")) {
      linesFound = parseInt(trimmed.slice(3), 10) || 0;
    } else if (trimmed.startsWith("LH:")) {
      linesHit = parseInt(trimmed.slice(3), 10) || 0;
    } else if (trimmed === "end_of_record" && currentFile) {
      result[currentFile] = { linesFound, linesHit };
      currentFile = null;
    }
  }

  return result;
}

function pct(hit: number, found: number): number {
  if (found === 0) return 0;
  return (hit / found) * 100;
}

function fmtPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function fmtDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

function totalCoverage(map: CoverageMap): { found: number; hit: number } {
  let found = 0;
  let hit = 0;
  for (const f of Object.values(map)) {
    found += f.linesFound;
    hit += f.linesHit;
  }
  return { found, hit };
}

/**
 * Generate a markdown coverage diff report for one or more packages.
 */
export function generateReport(packages: PackageCoverage[]): string {
  const lines: string[] = [
    "## Test Coverage Report",
    "",
    "Compared against `main`. Coverage collected via `bun test --coverage`.",
    "",
  ];

  for (const pkg of packages) {
    lines.push(`### ${pkg.name}`, "");

    const baseTotal = totalCoverage(pkg.base);
    const headTotal = totalCoverage(pkg.head);

    if (baseTotal.found === 0 && headTotal.found === 0) {
      lines.push("No test coverage data available.", "");
      continue;
    }

    const basePct = pct(baseTotal.hit, baseTotal.found);
    const headPct = pct(headTotal.hit, headTotal.found);
    const deltaPct = headPct - basePct;

    lines.push(
      "| Metric | main | this PR | +/- |",
      "|--------|-----:|--------:|----:|",
      `| Statements | ${baseTotal.found > 0 ? fmtPct(basePct) : "—"} | ${headTotal.found > 0 ? fmtPct(headPct) : "—"} | ${fmtDelta(deltaPct)} |`,
      ""
    );

    // Collect changed files
    const allFiles = new Set([
      ...Object.keys(pkg.base),
      ...Object.keys(pkg.head),
    ]);

    const changedFiles: {
      file: string;
      baseStr: string;
      headStr: string;
      deltaStr: string;
    }[] = [];

    for (const file of [...allFiles].sort()) {
      const b = pkg.base[file];
      const h = pkg.head[file];

      if (b && h) {
        const bp = pct(b.linesHit, b.linesFound);
        const hp = pct(h.linesHit, h.linesFound);
        if (Math.abs(hp - bp) < 0.05) continue; // unchanged
        changedFiles.push({
          file,
          baseStr: fmtPct(bp),
          headStr: fmtPct(hp),
          deltaStr: fmtDelta(hp - bp),
        });
      } else if (h && !b) {
        // new file
        changedFiles.push({
          file,
          baseStr: "—",
          headStr: fmtPct(pct(h.linesHit, h.linesFound)),
          deltaStr: "new",
        });
      } else if (b && !h) {
        // removed file
        changedFiles.push({
          file,
          baseStr: fmtPct(pct(b.linesHit, b.linesFound)),
          headStr: "—",
          deltaStr: "removed",
        });
      }
    }

    if (changedFiles.length > 0) {
      lines.push(
        "<details><summary>Files with coverage changes</summary>",
        "",
        "| File | main | this PR | +/- |",
        "|------|-----:|--------:|----:|"
      );
      for (const cf of changedFiles) {
        lines.push(
          `| ${cf.file} | ${cf.baseStr} | ${cf.headStr} | ${cf.deltaStr} |`
        );
      }
      lines.push("", "</details>", "");
    }
  }

  return lines.join("\n");
}

// CLI entrypoint: read lcov files from args and output markdown
if (import.meta.main) {
  const args = Bun.argv.slice(2);
  // Expected args: --packages name1:base1.lcov:head1.lcov name2:base2.lcov:head2.lcov
  const packages: PackageCoverage[] = [];

  for (const arg of args) {
    const [name, basePath, headPath] = arg.split(":");
    if (!name || !basePath || !headPath) {
      console.error(`Invalid arg: ${arg}. Expected name:baseLcov:headLcov`);
      process.exit(1);
    }

    let baseContent = "";
    let headContent = "";

    try {
      baseContent = await Bun.file(basePath).text();
    } catch {
      // no base coverage
    }

    try {
      headContent = await Bun.file(headPath).text();
    } catch {
      // no head coverage
    }

    packages.push({
      name,
      base: parseLcov(baseContent),
      head: parseLcov(headContent),
    });
  }

  console.log(generateReport(packages));
}
