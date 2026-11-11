"use client";

import { type ReactNode, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: ReactNode };

/**
 * A styled dropdown that still submits like a native <select>: Base UI renders a
 * hidden input with `name`, so it works inside plain GET forms. Pair it with a
 * <Label htmlFor={id}>, which names the trigger button for screen readers.
 */
export function FormSelect({
  id,
  name,
  defaultValue,
  options,
  placeholder,
  invalid = false,
  describedBy,
  submitOnChange = false,
  className,
}: {
  id: string;
  name: string;
  /** "" means nothing chosen yet: the placeholder shows and the form sends "" */
  defaultValue: string;
  options: SelectOption[];
  placeholder?: string;
  /** Red border for a validation error, like the other form fields */
  invalid?: boolean;
  /** Id of the error message, read out with the field */
  describedBy?: string;
  /** Submit the surrounding form as soon as a new option is picked (search filters) */
  submitOnChange?: boolean;
  className?: string;
}) {
  // Lets <SelectValue> show the chosen option's label (not its raw value)
  const items = Object.fromEntries(options.map((option) => [option.value, option.label]));
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <Select
      name={name}
      defaultValue={defaultValue === "" ? null : defaultValue}
      items={items}
      onValueChange={() => {
        if (!submitOnChange) return;
        // After this render, once the hidden input holds the new value
        setTimeout(() => trigger.current?.closest("form")?.requestSubmit());
      }}
    >
      <SelectTrigger
        ref={trigger}
        id={id}
        // The visible <Label id="<id>-label"> names the dropdown for screen readers;
        // a label's htmlFor alone doesn't reach this custom button (QA A-03)
        aria-labelledby={`${id}-label`}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? describedBy : undefined}
        className={cn(
          "bg-background/60 hover:bg-background/90 dark:bg-input/30 h-8 w-full min-w-0",
          className,
        )}
      >
        <SelectValue className="truncate" placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="rounded-xl p-1 shadow-xl">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="data-selected:bg-primary/10 data-selected:text-primary rounded-lg py-2 pl-2.5"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
