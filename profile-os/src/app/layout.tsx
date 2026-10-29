import type { Metadata } from "next";

export const metadata: Metadata = { title: "CyberCheck Profile OS", description: "Modular public profiles for local businesses." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
