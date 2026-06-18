import React, { useState } from "react";
import { Box, Text, render, useInput } from "ink";

import type { CommandCandidate } from "../types";

interface SelectCommandProps {
  candidates: CommandCandidate[];
  onSelect: (candidate: CommandCandidate | undefined) => void;
}

interface CommandPart {
  token: string;
  start: number;
  description?: string;
}

const shellOperators = ["&&", "||", ">>", "<<", "|", ";", "(", ")", "<", ">"] as const;

function riskLabel(candidate: CommandCandidate): string {
  return candidate.risk ? ` ${candidate.risk}` : "";
}

function operatorAt(command: string, index: number): string | undefined {
  return shellOperators.find((operator) => command.startsWith(operator, index));
}

function tokenizeCommand(command: string): CommandPart[] {
  const parts: CommandPart[] = [];
  let index = 0;

  while (index < command.length) {
    if (/\s/.test(command[index])) {
      index += 1;
      continue;
    }

    const operator = operatorAt(command, index);

    if (operator) {
      parts.push({ token: operator, start: index });
      index += operator.length;
      continue;
    }

    const start = index;
    let quote: string | undefined;

    while (index < command.length) {
      const char = command[index];

      if (char === "\\" && index + 1 < command.length) {
        index += 2;
        continue;
      }

      if (quote) {
        if (char === quote) {
          quote = undefined;
        }

        index += 1;
        continue;
      }

      if (char === "'" || char === '"') {
        quote = char;
        index += 1;
        continue;
      }

      if (/\s/.test(char) || operatorAt(command, index)) {
        break;
      }

      index += 1;
    }

    if (index === start) {
      index += 1;
      continue;
    }

    parts.push({ token: command.slice(start, index), start });
  }

  return parts;
}

function describePart(candidate: CommandCandidate, part: CommandPart, position: number): string | undefined {
  const explanations = candidate.explanations ?? [];
  const matched = explanations.find((explanation) => explanation.token === part.token);

  return matched?.description ?? explanations[position]?.description ?? candidate.description;
}

function getCommandParts(candidate: CommandCandidate): CommandPart[] {
  const parts = tokenizeCommand(candidate.command);

  if (parts.length === 0) {
    return [{ token: candidate.command, start: 0, description: candidate.description }];
  }

  return parts.map((part, position) => ({
    ...part,
    description: describePart(candidate, part, position)
  }));
}

function SelectCommand({ candidates, onSelect }: SelectCommandProps): React.ReactElement {
  const [index, setIndex] = useState(0);
  const [partIndex, setPartIndex] = useState(0);
  const lastCandidateIndex = Math.max(0, candidates.length - 1);
  const selectedCandidate = candidates[index];
  const selectedParts = selectedCandidate ? getCommandParts(selectedCandidate) : [];
  const lastSelectedPartIndex = Math.max(0, selectedParts.length - 1);
  const selectedPartIndex = Math.max(0, Math.min(partIndex, lastSelectedPartIndex));

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      const next = Math.max(0, index - 1);

      setIndex(next);
      setPartIndex(0);
      return;
    }

    if (key.downArrow || input === "j") {
      const next = Math.min(lastCandidateIndex, index + 1);

      setIndex(next);
      setPartIndex(0);
      return;
    }

    if (key.leftArrow || input === "h") {
      setPartIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (key.rightArrow || input === "l") {
      setPartIndex((current) => Math.min(lastSelectedPartIndex, current + 1));
      return;
    }

    if (key.return) {
      onSelect(candidates[index]);
      return;
    }

    if (key.escape || input === "q") {
      onSelect(undefined);
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>选择命令</Text>
      <Box flexDirection="column">
        {candidates.map((candidate, candidateIndex) => {
          const selected = candidateIndex === index;
          const selectedPart = selected ? selectedParts[selectedPartIndex] : undefined;

          return (
            <Box key={`${candidate.command}-${candidateIndex}`} flexDirection="column">
              <Text color={selected ? "green" : undefined}>
                {selected ? ">" : " "} {candidate.command}
                {riskLabel(candidate)}
              </Text>
              {selected && selectedPart ? (
                <Box flexDirection="column">
                  <Text color="gray">{`  ${" ".repeat(selectedPart.start)}^`}</Text>
                  <Text color="gray">  {selectedPart.description || candidate.description || "暂无说明"}</Text>
                </Box>
              ) : null}
            </Box>
          );
        })}
      </Box>
      <Text color="gray">Enter 选择 | ↑/↓ 或 j/k 切换命令 | ←/→ 或 h/l 查看片段 | q 取消</Text>
    </Box>
  );
}

export async function selectCommand(candidates: CommandCandidate[]): Promise<CommandCandidate | undefined> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("command selection requires an interactive terminal");
  }

  return new Promise((resolve) => {
    const app = render(
      <SelectCommand
        candidates={candidates}
        onSelect={(candidate) => {
          app.clear();
          app.unmount();
          void app.waitUntilExit().then(
            () => {
              resolve(candidate);
            },
            () => {
              resolve(candidate);
            }
          );
        }}
      />,
    );
  });
}
