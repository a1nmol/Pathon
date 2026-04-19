import type { Metadata } from "next";
import { getUser } from "@/lib/auth/session";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { StageNav } from "@/components/layout/StageNav";
import { TopNav } from "@/components/layout/TopNav";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { CursorGlow } from "@/components/layout/CursorGlow";
import { ToastProvider } from "@/components/layout/Toast";
import { ThemeProvider } from "@/context/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathon — Career Intelligence",
  description: "The AI system that reasons about your career over time. Not a job board. Not a résumé tool. A system built to understand you.",
};

// Inline script: sets data-theme before first paint to prevent flash
const noFlashScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="en" data-theme="dark">
      <head>
        {/* No-flash theme script — must run before any CSS paint */}
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <link rel="icon" type="image/png" href="/pathonlogo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=DM+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <SmoothScroll>
            <AuthProvider user={user}>
              <ScrollProgress />
              <CursorGlow />
              <ToastProvider />
              <TopNav />
              <StageNav />
              <CommandPalette />
              {children}
            </AuthProvider>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
