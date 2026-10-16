import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldClasses } from "@/components/ui/input";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
/** Required around SelectLabel: Radix throws if a label is rendered outside a group. */
const SelectGroup = SelectPrimitive.Group;

function SelectTrigger({
  className,
  children,
  pill = false,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  /** Rounded-full toolbar style (filters) instead of a form well. */
  pill?: boolean;
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        fieldClasses,
        "flex h-11 cursor-pointer items-center justify-between gap-2 px-3.5 text-left whitespace-nowrap data-[placeholder]:text-on-surface-variant/80 [&>span]:truncate",
        pill && "h-10 rounded-full bg-surface-container-low px-4 type-body-md-bold shadow-[0_2px_8px_rgb(70_60_45/0.04)]",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronsUpDown className="size-4 shrink-0 text-on-surface-variant" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position="popper"
        sideOffset={6}
        className={cn(
          "relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-lg bg-surface-container-lowest text-on-surface shadow-[0_12px_28px_rgb(70_60_45/0.14),0_2px_6px_rgb(70_60_45/0.06)]",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="w-full min-w-[var(--radix-select-trigger-width)] p-1.5">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center rounded-sm py-2 pr-8 pl-2.5 type-body-sm outline-none select-none focus:bg-surface-container data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:bg-primary-fixed/50 data-[state=checked]:text-primary data-[state=checked]:font-semibold",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2.5 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-3.5" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      className={cn("px-2.5 py-1.5 type-label-sm text-on-surface-variant uppercase", className)}
      {...props}
    />
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("-mx-1.5 my-1 h-px bg-surface-variant", className)} {...props} />;
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator };
