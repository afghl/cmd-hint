import React, { useState } from "react";
import { Box, Text, render, useInput } from "ink";

interface AuthInputProps {
  title: string;
  placeholder?: string;
  initialValue?: string;
  mask?: boolean;
  allowEmpty?: boolean;
  onSubmit: (value: string | undefined) => void;
}

function displayValue(value: string, mask: boolean): string {
  if (!value) {
    return "";
  }

  return mask ? "*".repeat(value.length) : value;
}

function AuthInput({
  title,
  placeholder,
  initialValue = "",
  mask = false,
  allowEmpty = false,
  onSubmit
}: AuthInputProps): React.ReactElement {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();
  const renderedValue = displayValue(value, mask);

  useInput((input, key) => {
    if (key.escape) {
      onSubmit(undefined);
      return;
    }

    if (key.return) {
      const trimmed = value.trim();

      if (!trimmed && !allowEmpty) {
        setError("不能为空");
        return;
      }

      onSubmit(trimmed);
      return;
    }

    if (key.backspace || key.delete) {
      setValue((current) => current.slice(0, -1));
      setError(undefined);
      return;
    }

    if (key.ctrl && input === "u") {
      setValue("");
      setError(undefined);
      return;
    }

    if (input) {
      setValue((current) => `${current}${input}`);
      setError(undefined);
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold>{title}</Text>
      <Text>
        {renderedValue}
        {!value && placeholder ? <Text color="gray">{placeholder}</Text> : null}
      </Text>
      {error ? <Text color="red">{error}</Text> : null}
      <Text color="gray">Enter 确认 | Esc 取消 | Ctrl+U 清空</Text>
    </Box>
  );
}

export async function promptAuthInput(options: Omit<AuthInputProps, "onSubmit">): Promise<string | undefined> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("input requires an interactive terminal");
  }

  return new Promise((resolve) => {
    const app = render(
      <AuthInput
        {...options}
        onSubmit={(value) => {
          app.clear();
          app.unmount();
          void app.waitUntilExit().then(
            () => {
              resolve(value);
            },
            () => {
              resolve(value);
            }
          );
        }}
      />
    );
  });
}
