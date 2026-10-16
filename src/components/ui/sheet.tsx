import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;
const SheetClose = SheetPrimitive.Close;

/** Right-hand clay drawer with a large rounded leading edge. */
function SheetContent({ className, children, ...props }: React.ComponentProps<typeof SheetPrimitive.Content>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-inverse-surface/35 backdrop-blur-[2px]" />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden bg-surface-container-low clay-sheen shadow-[0_20px_40px_-8px_rgb(70_60_45/0.22),0_6px_16px_-3px_rgb(70_60_45/0.1)] outline-none sm:w-[570px] sm:max-w-[92vw] sm:rounded-l-[36px]",
          className,
        )}
        {...props}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-white opacity-90" />
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose };
