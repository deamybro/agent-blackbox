import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = { title: "Agent BlackBox", description: "Risk firewall and flight recorder for autonomous trading agents" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header className="nav"><div className="container" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <Link href="/" className="brand"><span className="brand-mark"><ShieldCheck size={17}/></span>Agent BlackBox</Link>
      <nav className="navlinks"><Link href="/dashboard">Dashboard</Link><Link href="/audit">Audit logs</Link><Link href="/reports">Reports</Link><Link href="/sdk">Developer SDK</Link></nav>
      <span className="status"><i className="dot"/>Mainnet data · paper only</span>
    </div></header>
    {children}
  </body></html>;
}
