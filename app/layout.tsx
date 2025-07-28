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
import { Footer } from "@/components/footer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Menu } from "lucide-react" // Import Menu icon
import localFont from "next/font/local"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet" // Import Sheet components

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
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <nav className="border-b border-border bg-white dark:bg-card">
                <div className="max-w-7xl mx-auto px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {/* Hamburger icon for mobile */}
                      <div className="xl:hidden mr-4">
                        <Sheet>
                          <SheetTrigger asChild>
                            <button className="p-2 -ml-2 rounded-md text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
                              <Menu className="h-6 w-6" />
                              <span className="sr-only">Open menu</span>
                            </button>
                          </SheetTrigger>
                          <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-background p-6">
                            <div className="flex flex-col space-y-4">
                              <span className="font-neuropol text-foreground text-lg mb-4">SENTIBOARD</span>
                              <Link href="/" className="text-foreground hover:text-primary transition-colors w-full">
                                Home
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="text-foreground hover:text-primary transition-colors w-full flex items-center justify-between">
                                  Signals
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-background border-border w-[calc(100%-1rem)]">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href="/google-trend-signals"
                                      className="text-foreground hover:text-primary transition-colors w-full"
                                    >
                                      Google Trends
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href="/twitter-signals"
                                      className="text-foreground hover:text-primary transition-colors w-full"
                                    >
                                      Twitter Signals
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href="/news-signals"
                                      className="text-foreground hover:text-primary transition-colors w-full"
                                    >
                                      News Signals
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Link
                                href="/performance"
                                className="text-foreground hover:text-primary transition-colors w-full"
                              >
                                Performance
                              </Link>
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>
                      {/* SENTIBOARD Logo - stays on left */}
                      <span className="font-neuropol text-foreground text-lg">SENTIBOARD</span>
                    </div>

                    <div className="hidden xl:flex items-center space-x-4">
                      {/* Navigation menu items */}
                      <Link href="/" className="text-foreground hover:text-primary transition-colors whitespace-nowrap">
                        Home
                      </Link>

                      {/* Signals Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger className="text-foreground hover:text-primary transition-colors whitespace-nowrap flex items-center">
                          Signals
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-background border-border">
                          <DropdownMenuItem asChild>
                            <Link
                              href="/google-trend-signals"
                              className="text-foreground hover:text-primary transition-colors w-full"
                            >
                              Google Trends
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/twitter-signals"
                              className="text-foreground hover:text-primary transition-colors w-full"
                            >
                              Twitter Signals
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href="/news-signals"
                              className="text-foreground hover:text-primary transition-colors w-full"
                            >
                              News Signals
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Link
                        href="/performance"
                        className="text-foreground hover:text-primary transition-colors whitespace-nowrap"
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
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
