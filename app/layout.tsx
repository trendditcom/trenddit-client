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
                    <a href="/trends" className="text-gray-700 hover:text-indigo-600 font-medium">
                      Trends
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
