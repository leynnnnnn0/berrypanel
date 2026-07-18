import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function DashboardPage({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1500px] flex-col gap-6 text-[#2F4156]",
        className,
      )}
      {...props}
    />
  );
}
