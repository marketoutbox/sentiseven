import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import { ThemeProvider } from "@/context/theme-context"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "@/components/ui/toaster"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu } from "lucide-react" // Import Menu icon
import localFont from "next/font/local"


const inter = Inter({ subsets: ["latin"] })

// Load Neuropol font locally
const neuropol = localFont({
  src: "../public/fonts/neuropol.otf",
  variable: "--font-neuropol",
})

export const metadata: Metadata = {
  title: "Sentiment Dashboard",
  description: "Track market sentiment across multiple data sources",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${neuropol.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gradient-to-b from-[#010310] to-[#030516] text-foreground">
              <nav className="">
                <div className="max-w-7xl mx-auto px-6 py-4">
                  <div className="flex justify-between items-center">
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

                    <div className="hidden xl:flex items-center space-x-4">
                      {/* Navigation menu items */}
                      <Link href="/" className="text-white hover:text-blue-200 transition-colors whitespace-nowrap">
                        Home
                      </Link>

                      {/* Signals Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-white hover:text-blue-200 transition-colors whitespace-nowrap flex items-center">
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
                        href="/performance"
                        className="text-white hover:text-blue-200 transition-colors whitespace-nowrap"
                      >
                        Performance
                      </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                      <ThemeToggle />
                      <UserNav />
                    </div>
                  </div>
                </div>
              </nav>
              {children}
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
