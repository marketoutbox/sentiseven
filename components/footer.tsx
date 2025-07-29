import Link from "next/link"
import { Github, Twitter, Linkedin, Mail, Globe, Clock } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border/50 glass-morphism">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div>
              <span className="font-neuropol text-gradient text-xl font-bold tracking-wider">SENTIBOARD</span>
              <p className="text-muted-foreground text-sm mt-2">
                Advanced sentiment analysis for informed investment decisions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Data updates every 15 minutes</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Platform</h3>
            <nav className="space-y-2">
              <Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/twitter-signals" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Twitter Signals
              </Link>
              <Link href="/google-trend-signals" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Google Trends
              </Link>
              <Link href="/news-signals" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                News Signals
              </Link>
              <Link href="/performance" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Performance
              </Link>
            </nav>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Company</h3>
            <nav className="space-y-2">
              <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          {/* Social & Status */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm">Connect</h3>
            <div className="flex gap-3">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Linkedin className="h-4 w-4" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 status-indicator status-online"></div>
              <span className="text-muted-foreground">All systems operational</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © 2025 Sentiboard. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Market data provided by Yahoo Finance</span>
            <span>•</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}