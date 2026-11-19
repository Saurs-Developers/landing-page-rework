import type { Link } from "@/content/types";

type Variant = "primary" | "secondary";

const base =
  "inline-flex items-center justify-center rounded-pill px-6 py-3 font-bold transition-colors duration-(--dur-fast) ease-standard";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-text-on-brand hover:bg-brand-hover",
  secondary: "border border-border-strong text-text hover:border-brand-line",
};

interface ButtonLinkProps {
  link: Link;
  variant?: Variant;
  magnetic?: boolean;
  className?: string;
}

/** Link com cara de botão. Links externos abrem em nova aba e avisam o leitor de tela. */
export function ButtonLink({
  link,
  variant = "primary",
  magnetic,
  className = "",
}: ButtonLinkProps) {
  return (
    <a
      href={link.href}
      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...(magnetic ? { "data-magnetic": true } : {})}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {link.label}
      {link.external && <span className="sr-only"> (abre em nova aba)</span>}
    </a>
  );
}
