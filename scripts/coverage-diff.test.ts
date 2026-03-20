import { describe, expect, it } from "bun:test";
import { parseLcov, generateReport } from "./coverage-diff";

const sampleLcov = `SF:src/index.ts
LF:10
LH:8
end_of_record
SF:src/routes/login.ts
LF:20
LH:17
end_of_record
`;

const sampleLcovWithPrefix = `SF:/checkout/__base/backend/src/index.ts
LF:10
LH:8
end_of_record
SF:/checkout/__base/backend/src/routes/login.ts
LF:20
LH:17
end_of_record
`;

describe("parseLcov", () => {
  it("parses lcov content into per-file coverage", () => {
    const result = parseLcov(sampleLcov);
    expect(result).toEqual({
      "src/index.ts": { linesFound: 10, linesHit: 8 },
      "src/routes/login.ts": { linesFound: 20, linesHit: 17 },
    });
  });

  it("strips a path prefix when provided", () => {
    const result = parseLcov(sampleLcovWithPrefix, "/checkout/__base/backend/");
    expect(result).toEqual({
      "src/index.ts": { linesFound: 10, linesHit: 8 },
      "src/routes/login.ts": { linesFound: 20, linesHit: 17 },
    });
  });

  it("returns empty object for empty input", () => {
    expect(parseLcov("")).toEqual({});
  });

  it("returns empty object for malformed input", () => {
    expect(parseLcov("garbage\ndata\n")).toEqual({});
  });

  it("handles records missing LH or LF gracefully", () => {
    const incomplete = `SF:src/foo.ts
LF:5
end_of_record
`;
    const result = parseLcov(incomplete);
    expect(result).toEqual({
      "src/foo.ts": { linesFound: 5, linesHit: 0 },
    });
  });
});

describe("generateReport", () => {
  it("generates markdown with coverage diff for a single package", () => {
    const base = { "src/index.ts": { linesFound: 10, linesHit: 8 } };
    const head = { "src/index.ts": { linesFound: 10, linesHit: 9 } };

    const report = generateReport([{ name: "backend", base, head }]);

    expect(report).toContain("## Coverage Report");
    expect(report).toContain("### backend");
    expect(report).toContain("80.0%"); // base
    expect(report).toContain("90.0%"); // head
    expect(report).toContain("+10.0%"); // delta
  });

  it("generates markdown for multiple packages", () => {
    const data = [
      {
        name: "backend",
        base: { "src/a.ts": { linesFound: 10, linesHit: 5 } },
        head: { "src/a.ts": { linesFound: 10, linesHit: 7 } },
      },
      {
        name: "mcp-server",
        base: { "src/b.ts": { linesFound: 20, linesHit: 10 } },
        head: { "src/b.ts": { linesFound: 20, linesHit: 15 } },
      },
    ];

    const report = generateReport(data);
    expect(report).toContain("### backend");
    expect(report).toContain("### mcp-server");
  });

  it("shows new files as having 0% base coverage", () => {
    const base = {};
    const head = { "src/new.ts": { linesFound: 10, linesHit: 8 } };

    const report = generateReport([{ name: "pkg", base, head }]);
    expect(report).toContain("src/new.ts");
    expect(report).toContain("—"); // no base coverage marker
    expect(report).toContain("80.0%");
  });

  it("shows removed files in the diff", () => {
    const base = { "src/old.ts": { linesFound: 10, linesHit: 8 } };
    const head = {};

    const report = generateReport([{ name: "pkg", base, head }]);
    expect(report).toContain("src/old.ts");
    expect(report).toContain("removed");
  });

  it("handles empty coverage data", () => {
    const report = generateReport([{ name: "pkg", base: {}, head: {} }]);
    expect(report).toContain("No coverage data");
  });

  it("only shows changed files in the details section", () => {
    const base = {
      "src/unchanged.ts": { linesFound: 10, linesHit: 8 },
      "src/changed.ts": { linesFound: 10, linesHit: 5 },
    };
    const head = {
      "src/unchanged.ts": { linesFound: 10, linesHit: 8 },
      "src/changed.ts": { linesFound: 10, linesHit: 7 },
    };

    const report = generateReport([{ name: "pkg", base, head }]);
    expect(report).toContain("src/changed.ts");
    expect(report).not.toContain("src/unchanged.ts");
  });
});
