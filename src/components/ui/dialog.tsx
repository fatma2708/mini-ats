import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

/** Round clay close button shared by dialogs and the drawer. */
function CloseButton({ className }: { className?: string }) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-container text-on-surface-variant shadow-highlight transition-colors hover:bg-surface-container-highest hover:text-on-surface",
        className,
      )}
    >
      <XIcon className="size-5" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  );
}

function DialogContent({
  className,
  children,
  accent = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  /** Thin indigo gradient bar on top (Add candidate design). */
  accent?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-on-surface/30 backdrop-blur-md" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-clay-lg outline-none",
          className,
        )}
        {...props}
      >
        {accent && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed via-primary to-primary-container" />
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/** Header row: title block on the left, close button on the right. */
function DialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex shrink-0 items-start justify-between gap-4 px-6 pt-6 pb-3 sm:px-8 sm:pt-8", className)} {...props}>
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
      <CloseButton />
    </div>
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto px-6 py-4 sm:px-8", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col-reverse gap-3 bg-surface-container-low/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8",
        className,
      )}
      {...props}
    />
  );
}

function DialogEyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("type-label-sm text-primary uppercase", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("type-headline-md text-on-surface", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("type-body-sm text-on-surface-variant", className)} {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  CloseButton,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogEyebrow,
  DialogTitle,
  DialogDescription,
};
