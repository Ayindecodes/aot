import Image from "next/image";

// The figure and wordmark from the supplied logo. The ring and tagline can't be read at
// header size, so they're left out here and shown in full by LogoEmblem.
export function Logo() {
  return (
    <Image
      src="/logo/aot-logo-header.png"
      alt="AOT.ng"
      width={284}
      height={200}
      priority
      className="h-14 w-auto lg:h-[4.25rem]"
    />
  );
}

export function LogoEmblem({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo/aot-logo.webp"
      alt="AOT.ng, Modest. Elegant.You"
      width={320}
      height={316}
      className={className}
    />
  );
}
