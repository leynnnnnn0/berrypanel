'use client';

import Link from 'next/link';

export default function AppLogo() {
    return (
      <Link href="/" className="cursor-pointer">
        <span className="text-sm text-center font-bold">
          Next.js / Laravel Starter Kit
        </span>
      </Link>
    );
}
