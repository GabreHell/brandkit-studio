// Measured wrapping also handles long URLs/names with no whitespace.
export function wrapText(
  text: string,
  width: number,
  measure: (text: string) => number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= width) {
        line = candidate;
        continue;
      }
      if (line) {
        lines.push(line);
        line = "";
      }
      for (const char of Array.from(word)) {
        if (line && measure(line + char) > width) {
          lines.push(line);
          line = "";
        }
        line += char;
      }
    }
    lines.push(line);
  }
  return lines;
}
