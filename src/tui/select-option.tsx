import React, { useState } from "react";
import { Box, Text, render, useInput } from "ink";

export interface SelectOption<T extends string = string> {
  id: T;
  label: string;
  description?: string;
}

interface SelectOptionProps<T extends string> {
  title: string;
  options: SelectOption<T>[];
  onSelect: (id: T | undefined) => void;
}

function SelectOptionList<T extends string>({ title, options, onSelect }: SelectOptionProps<T>): React.ReactElement {
  const [index, setIndex] = useState(0);
  const lastIndex = Math.max(0, options.length - 1);
  const selected = options[index];

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (key.downArrow || input === "j") {
      setIndex((current) => Math.min(lastIndex, current + 1));
      return;
    }

    if (key.return) {
      onSelect(selected?.id);
      return;
    }

    if (key.escape || input === "q") {
      onSelect(undefined);
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>{title}</Text>
      <Box flexDirection="column">
        {options.map((option, optionIndex) => {
          const isSelected = optionIndex === index;

          return (
            <Box key={option.id} flexDirection="column">
              <Text color={isSelected ? "green" : undefined}>
                {isSelected ? ">" : " "} {option.label}
              </Text>
              {isSelected && option.description ? <Text color="gray">  {option.description}</Text> : null}
            </Box>
          );
        })}
      </Box>
      <Text color="gray">Enter 选择 | ↑/↓ 或 j/k 切换 | q 取消</Text>
    </Box>
  );
}

export async function selectOption<T extends string>(
  title: string,
  options: SelectOption<T>[]
): Promise<T | undefined> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("selection requires an interactive terminal");
  }

  if (options.length === 0) {
    return undefined;
  }

  return new Promise((resolve) => {
    const app = render(
      <SelectOptionList
        title={title}
        options={options}
        onSelect={(id) => {
          app.clear();
          app.unmount();
          void app.waitUntilExit().then(
            () => {
              resolve(id);
            },
            () => {
              resolve(id);
            }
          );
        }}
      />
    );
  });
}
