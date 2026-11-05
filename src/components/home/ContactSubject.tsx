"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import styles from "./contact-subject.module.css";

/**
 * Subject picker styled like the rest of the site instead of the operating system menu.
 * Radix keeps it a labelled combobox with full keyboard support and a hidden native select
 * for the form. The required check lives in the form's submit handler.
 */
export function ContactSubject({
  id,
  value,
  options,
  onChange,
  className,
  onBlur,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className: string;
  onBlur?: () => void;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Select.Root name="subject" value={value} onValueChange={onChange}>
      <Select.Trigger
        id={id}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onBlur={(event) => {
          if (!event.relatedTarget?.closest('[role="listbox"]')) onBlur?.();
        }}
        className={`${className} ${styles.trigger} flex items-center justify-between gap-2 text-left ${value ? "text-white" : "text-white/60"}`}
      >
        <Select.Value placeholder="Select a subject" />
        <Select.Icon asChild>
          <ChevronDown aria-hidden className={`${styles.chevron} size-4 shrink-0 text-white/40`} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          onCloseAutoFocus={() => onBlur?.()}
          position="popper"
          sideOffset={6}
          className={`${styles.menu} z-50 overflow-hidden rounded-xl border border-white/10 bg-(--overlay-bg) shadow-2xl backdrop-blur-xl`}
        >
          <Select.Viewport className="p-1.5">
            {options.map((option) => (
              <Select.Item
                key={option}
                value={option}
                className="data-[state=checked]:text-brand-bright relative flex cursor-pointer items-center rounded-lg py-2 pr-9 pl-3 text-sm text-white/80 outline-none select-none data-[highlighted]:bg-white/8 data-[highlighted]:text-white"
              >
                <Select.ItemText>{option}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-3 inline-flex">
                  <Check aria-hidden className="size-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
