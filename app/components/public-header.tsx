import Link from "next/link";
export function PublicHeader() { return <header className="public-header"><Link className="public-logo" href="/">me2u<span>/</span></Link><nav><Link href="/track">Track an order</Link><Link href="/merchant">For merchants</Link><Link href="/drive">Drive with Me2U</Link><Link className="header-signin" href="/login">Sign in</Link></nav></header>; }
