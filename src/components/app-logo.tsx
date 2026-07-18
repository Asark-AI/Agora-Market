
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";
import { appConfig } from "@/lib/config";

interface AppLogoProps extends SVGProps<SVGSVGElement> {
  logoPath?: string;
}

export function AppLogo({ logoPath, ...props }: AppLogoProps) {
  const path = logoPath || appConfig.logo.path;
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={cn("size-6", props.className)}
      {...props}
    >
      <title>Agora Logo</title>
      <path d={path} fillRule="evenodd" fill="currentColor" />
    </svg>
  );
}

