import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Me2U / Delivery control plane", description: "Multi-tenant delivery operations" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
