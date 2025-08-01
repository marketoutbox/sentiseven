"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  const isActivePage = (href: string) => {
    if (href === "/" && pathname === "/") return true
    if (href !== "/" && pathname.startsWith(href)) return true
    return false
  }

  const isActiveSignalPage = () => {
    return pathname.includes('/google-trend-signals') || 
           pathname.includes('/twitter-signals') || 
           pathname.includes('/news-signals')
  }

  // Base classes for navigation links
  const baseLinkClasses = "text-white transition-all duration-300 whitespace-nowrap relative pb-2"
  const activeLinkClasses = "border-b-2 border-[#1e31dd]"
  const hoverLinkClasses = "hover:border-b-2 hover:border-[#1e31dd]"

  return (
    <nav className="">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Logo */}
          <div className="flex items-center">
            {/* Mobile dropdown menu */}
            <div className="xl:hidden mr-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 -ml-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="bg-[#090e23] border border-[#0e142d] rounded-xl shadow-lg shadow-[#030516]/30 w-48" 
                  align="start"
                >
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/" 
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      Home
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/google-trend-signals" 
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      Google Trends
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/twitter-signals" 
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      Twitter Signals
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/news-signals" 
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      News Signals
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/portfolio-tracker" 
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      Portfolio Tracker
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link 
                      href="/performance" 
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      Performance
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* SENTIBOARD Logo - stays on left */}
            <span className="font-neuropol text-white text-lg">SENTIBOARD</span>
          </div>

          {/* Right side - Navigation + User */}
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation menu items - moved to right */}
            <div className="hidden xl:flex items-center space-x-6">
              <Link 
                href="/" 
                className={`${baseLinkClasses} ${hoverLinkClasses} ${isActivePage("/") ? activeLinkClasses : ""}`}
              >
                Home
              </Link>

              {/* Signals Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger 
                  className={`${baseLinkClasses} ${hoverLinkClasses} ${isActiveSignalPage() ? activeLinkClasses : ""} flex items-center focus:outline-none`}
                >
                  Signals
                  <ChevronDown className="ml-1 h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#090e23] border border-[#0e142d] rounded-xl shadow-lg shadow-[#030516]/30">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/google-trend-signals"
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      Google Trends
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/twitter-signals"
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      Twitter Signals
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/news-signals"
                      className="text-white hover:bg-[#192233] transition-colors w-full flex items-center px-3 py-2"
                    >
                      News Signals
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                href="/portfolio-tracker"
                className={`${baseLinkClasses} ${hoverLinkClasses} ${isActivePage("/portfolio-tracker") ? activeLinkClasses : ""}`}
              >
                Portfolio
              </Link>

              <Link
                href="/performance"
                className={`${baseLinkClasses} ${hoverLinkClasses} ${isActivePage("/performance") ? activeLinkClasses : ""}`}
              >
                Performance
              </Link>
            </div>

            {/* User Navigation - no theme toggle */}
            <UserNav />
          </div>
        </div>
      </div>
    </nav>
  )
}