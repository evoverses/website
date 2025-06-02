import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning: "border-warning/50 text-warning dark:border-warning [&>svg]:text-warning",
        danger: "border-danger/50 text-danger dark:border-danger [&>svg]:text-danger",
        success: "border-success/50 text-success dark:border-success [&>svg]:text-success",
        info: "border-info/50 text-info dark:border-info [&>svg]:text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = (
  {
    ref,
    className,
    variant,
    ...props
  }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>,
) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
);
Alert.displayName = "Alert";

const AlertTitle = (
  {
    ref,
    className,
    ...props
  }: HTMLAttributes<HTMLHeadingElement> & {
    ref: React.RefObject<HTMLParagraphElement>;
  },
) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = (
  {
    ref,
    className,
    ...props
  }: HTMLAttributes<HTMLParagraphElement> & {
    ref: React.RefObject<HTMLParagraphElement>;
  },
) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
