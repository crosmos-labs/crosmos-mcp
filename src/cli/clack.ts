import * as clack from "@clack/prompts";

export const intro = clack.intro as (message: string) => void;
export const outro = clack.outro as (message: string) => void;

export const log = {
  message: clack.log.message as (msg: string) => void,
  info: clack.log.info as (msg: string) => void,
  success: clack.log.success as (msg: string) => void,
  step: clack.log.step as (msg: string) => void,
  warn: clack.log.warn as (msg: string) => void,
  error: clack.log.error as (msg: string) => void,
};

export async function text(options: {
  message: string;
  placeholder?: string;
  validate?: (value: string | undefined) => string | Error | undefined;
}): Promise<string | symbol> {
  return clack.text(options) as Promise<string | symbol>;
}

export async function confirm(options: {
  message: string;
  initialValue?: boolean;
}): Promise<boolean | symbol> {
  return clack.confirm(options) as Promise<boolean | symbol>;
}

export async function multiselect(options: {
  message: string;
  options: Array<{ value: string; label: string; hint?: string }>;
  initialValues?: string[];
  required?: boolean;
}): Promise<string[] | symbol> {
  return clack.multiselect(options) as Promise<string[] | symbol>;
}

export function spinner(): { start: (msg?: string) => void; stop: (msg?: string) => void } {
  return clack.spinner() as unknown as {
    start: (msg?: string) => void;
    stop: (msg?: string) => void;
  };
}

export const isCancel = clack.isCancel as (value: unknown) => boolean;
