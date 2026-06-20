import { cn } from "@/lib/utils";

/** Centered page container — content max-width matches cyborgmen.com (~1200px). */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-6 md:px-10", className)}>
      {children}
    </div>
  );
}
