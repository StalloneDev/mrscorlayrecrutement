import React from "react";

interface FormattedPromptProps {
  prompt: string;
  hidePartHeader?: boolean;
}

interface Block {
  type: "part_header" | "question_title" | "work_header" | "letter_item" | "bullet_item" | "num_item" | "pre" | "text" | "empty";
  marker?: string;
  text?: string;
}

export function parsePromptBlocks(rawPrompt: string): Block[] {
  const lines = rawPrompt.split("\n");
  const blocks: Block[] = [];
  let currentPre: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Lignes de tableau ascii
    if (
      line.includes("┌") ||
      line.includes("│") ||
      line.includes("├") ||
      line.includes("└") ||
      line.includes("┼") ||
      line.includes("┴") ||
      line.includes("┬")
    ) {
      currentPre.push(rawLine);
      continue;
    } else if (currentPre.length > 0) {
      blocks.push({ type: "pre", text: currentPre.join("\n") });
      currentPre = [];
    }

    if (!line) {
      blocks.push({ type: "empty" });
      continue;
    }

    if (/^(?:Partie|Épreuve)\s*[A-Z0-9]+\s*:/i.test(line)) {
      blocks.push({ type: "part_header", text: line });
    } else if (/^Question\s*\d+[\.\s—\-]/i.test(line)) {
      blocks.push({ type: "question_title", text: line });
    } else if (/^Travail demandé\s*:?/i.test(line)) {
      blocks.push({ type: "work_header", text: line });
    } else if (/^([a-z]\.|\([a-z]\)|[a-z]\))\s*(.*)/i.test(line)) {
      const m = line.match(/^([a-z]\.|\([a-z]\)|[a-z]\))\s*(.*)/i);
      blocks.push({ type: "letter_item", marker: m ? m[1] : "", text: m ? m[2] : line });
    } else if (/^(•|\-|\*)\s*(.*)/.test(line)) {
      const m = line.match(/^(•|\-|\*)\s*(.*)/);
      blocks.push({ type: "bullet_item", marker: "•", text: m ? m[2] : line });
    } else if (/^(\d+\.)\s*(.*)/.test(line)) {
      const m = line.match(/^(\d+\.)\s*(.*)/);
      blocks.push({ type: "num_item", marker: m ? m[1] : "", text: m ? m[2] : line });
    } else {
      blocks.push({ type: "text", text: line });
    }
  }

  if (currentPre.length > 0) {
    blocks.push({ type: "pre", text: currentPre.join("\n") });
  }

  return blocks;
}

export function FormattedPrompt({ prompt, hidePartHeader = false }: FormattedPromptProps) {
  const blocks = parsePromptBlocks(prompt);

  return (
    <div style={{ lineHeight: 1.7, color: "#1e293b", fontSize: 14.5 }}>
      {blocks.map((block, idx) => {
        if (block.type === "empty") {
          return <div key={idx} style={{ height: 10 }} />;
        }

        if (block.type === "part_header") {
          if (hidePartHeader) return null;
          return (
            <div
              key={idx}
              style={{
                display: "inline-block",
                background: "#eff6ff",
                color: "#1e3a8a",
                border: "1px solid #bfdbfe",
                padding: "4px 12px",
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 13,
                marginBottom: 10,
                letterSpacing: "0.02em",
              }}
            >
              {block.text}
            </div>
          );
        }

        if (block.type === "question_title") {
          return (
            <div
              key={idx}
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#0f172a",
                margin: "12px 0 8px",
                paddingBottom: 6,
                borderBottom: "1.5px solid #e2e8f0",
              }}
            >
              {block.text}
            </div>
          );
        }

        if (block.type === "work_header") {
          return (
            <div
              key={idx}
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: "#1e3a8a",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginTop: 16,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>📌</span>
              <span>{block.text}</span>
            </div>
          );
        }

        if (block.type === "letter_item") {
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                paddingLeft: 24,
                margin: "6px 0",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: "#1e3a8a",
                  minWidth: 24,
                  fontSize: 14.5,
                }}
              >
                {block.marker}
              </span>
              <span style={{ flex: 1, color: "#334155" }}>{block.text}</span>
            </div>
          );
        }

        if (block.type === "bullet_item") {
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                paddingLeft: 24,
                margin: "6px 0",
              }}
            >
              <span
                style={{
                  color: "#1e3a8a",
                  fontWeight: 900,
                  fontSize: 16,
                  lineHeight: "20px",
                  minWidth: 16,
                }}
              >
                •
              </span>
              <span style={{ flex: 1, color: "#334155" }}>{block.text}</span>
            </div>
          );
        }

        if (block.type === "num_item") {
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                paddingLeft: 24,
                margin: "6px 0",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: "#1e3a8a",
                  minWidth: 24,
                  fontSize: 14.5,
                }}
              >
                {block.marker}
              </span>
              <span style={{ flex: 1, color: "#334155" }}>{block.text}</span>
            </div>
          );
        }

        if (block.type === "pre") {
          return (
            <pre
              key={idx}
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                background: "#f8fafc",
                padding: "16px 18px",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                overflowX: "auto",
                fontSize: 12.5,
                lineHeight: 1.45,
                color: "#0f172a",
                margin: "12px 0",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              {block.text}
            </pre>
          );
        }

        return (
          <p
            key={idx}
            style={{
              margin: "6px 0",
              color: "#334155",
              fontSize: 14.5,
            }}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
