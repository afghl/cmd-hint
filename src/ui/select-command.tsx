import React, { useState } from "react";
import { Box, Text, render, useInput } from "ink";

import type { CommandCandidate } from "../types";

interface SelectCommandProps {
  candidates: CommandCandidate[];
  onSelect: (candidate: CommandCandidate | undefined) => void;
}

function riskLabel(candidate: CommandCandidate): string {
  return candidate.risk ? ` ${candidate.risk}` : "";
}

function SelectCommand({ candidates, onSelect }: SelectCommandProps): React.ReactElement {
  const [index, setIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (key.downArrow || input === "j") {
      setIndex((current) => Math.min(candidates.length - 1, current + 1));
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

          return (
            <Box key={`${candidate.command}-${candidateIndex}`} flexDirection="column">
              <Text color={selected ? "green" : undefined}>
                {selected ? ">" : " "} {candidate.command}
                {riskLabel(candidate)}
              </Text>
              {candidate.description ? (
                <Text color="gray">  {candidate.description}</Text>
              ) : null}
            </Box>
          );
        })}
      </Box>
      <Text color="gray">Enter 选择 | ↑/↓ 或 j/k 移动 | q 取消</Text>
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
      { alternateScreen: true }
    );
  });
}
