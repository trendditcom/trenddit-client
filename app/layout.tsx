import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trenddit - AI Engineering Advisory Platform",
  description: "Transform AI trends into actionable engineering roadmaps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TRPCProvider>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-indigo-600">Trenddit</h1>
                  </div>
                  <div className="flex items-center gap-4">
                    <a href="/trends" className="text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-1">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v15A2.5 2.5 0 0 0 9.5 22h5a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 14.5 2h-5Z"/>
                        <path d="M12 6h.01M12 12h.01M12 18h.01"/>
                      </svg>
                      AI Intelligence
                    </a>
                    <a href="/needs" className="text-gray-700 hover:text-indigo-600 font-medium">
                      Needs
                    </a>
                    <a href="/solutions" className="text-gray-700 hover:text-indigo-600 font-medium">
                      Solutions
                    </a>
                  </div>
                </div>
              </div>
            </nav>
            <main>{children}</main>
          </div>
        </TRPCProvider>
      </body>
    </html>
  );
}
