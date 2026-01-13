import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NodePilot Dashboard",
  description: "High-performance CI/CD management for NodePilot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-lg">N</div>
              <h1 className="text-xl font-bold tracking-tight">NodePilot</h1>
            </div>
            <nav>
              <ul className="flex gap-6 text-sm font-medium text-muted hover:text-foreground">
                <li><a href="/" className="hover:text-primary transition-colors">Projects</a></li>
                <li><a href="/jobs" className="hover:text-primary transition-colors">Build History</a></li>
                <li><a href="/settings" className="hover:text-primary transition-colors">Settings</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-border py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted">
            &copy; {new Date().getFullYear()} NodePilot CI/CD. Built for performance.
          </div>
        </footer>
      </body>
    </html>
  );
}
