import Link from "next/link";
import Image from "next/image";

export function Brand({ inverse = false, size = "md" }: { inverse?: boolean; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? 32 : size === "lg" ? 56 : 40;

  return (
    <Link href="/" className={`brand ${inverse ? "brand-inverse" : ""}`}>
      <Image
        src="/logo-mrs.png"
        alt="MRS Logo"
        width={dims}
        height={dims}
        className="brand-logo"
        priority
      />
      <span className="brand-name">
        MRS <b>&</b> CORLAY
        <small>RECRUTEMENT & ÉVALUATION</small>
      </span>
    </Link>
  );
}
