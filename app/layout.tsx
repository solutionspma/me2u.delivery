import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Me2U / Local delivery, from them to you", description: "Local food, essentials, and neighborhood finds delivered by Me2U." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
