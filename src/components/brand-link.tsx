import Image from "next/image";
import Link from "next/link";

type BrandLinkProps = {
  href: string;
  variant?: "compact" | "primary";
  className?: string;
};

export function BrandLink({
  href,
  variant = "compact",
  className = "",
}: BrandLinkProps) {
  return (
    <Link
      href={href}
      className={`brand-link brand-link--${variant} ${className}`.trim()}
      aria-label="Diamond Alibi home"
    >
      {variant === "primary" ? (
        <Image
          src="/brand/diamond-alibi-primary.webp"
          width={1293}
          height={826}
          alt="Diamond Alibi"
          loading="eager"
          unoptimized
        />
      ) : (
        <>
          <Image
            src="/brand/diamond-alibi-icon-64.png"
            width={40}
            height={40}
            alt=""
            unoptimized
          />
          <span>Diamond Alibi</span>
        </>
      )}
    </Link>
  );
}
