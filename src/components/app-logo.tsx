
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import { appConfig } from "@/lib/config";

interface AppLogoProps extends HTMLAttributes<HTMLDivElement> {
  logoPath?: string;
}

export function AppLogo({ logoPath, className, ...props }: AppLogoProps) {
  if (logoPath) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        className={cn("size-6", className)}
        {...props}
      >
        <title>Agora Logo</title>
        <path d={logoPath || appConfig.logo.path} fillRule="evenodd" fill="currentColor" />
      </svg>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <Image src="/agora-logo.png" alt="Agora Logo" fill className="object-contain" />
    </div>
  );
}

