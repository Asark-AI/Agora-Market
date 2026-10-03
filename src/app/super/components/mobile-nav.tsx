
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/app/super/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/app/super/components/ui/sheet"
import { Menu } from "lucide-react"
import { Logo } from "./icons"
import { appConfig } from "@/app/super/lib/config"

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface MobileNavProps {
  navItems: NavItem[];
}

export function MobileNav({ navItems }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div
            onClick={() => {
                router.push("/super/app/dashboard")
                setOpen(false)
            }}
          className="mr-4 flex cursor-pointer items-center gap-2"
        >
            <Logo className="h-10 w-10 shrink-0 text-foreground" />
            <span className="whitespace-nowrap font-bold text-lg text-foreground">{appConfig.siteName}</span>
        </div>
        <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
            {navItems?.map(
              (item) =>
                item.href && (
                  <button
                    key={item.href}
                    className="flex items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent"
                    onClick={() => {
                        router.push(item.href)
                        setOpen(false)
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </button>
                )
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
