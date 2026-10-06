import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function Custom404() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-16 text-gray-900">
      <section className="w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Compass aria-hidden="true" size={27} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Error 404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-600">
          This page may have moved, or the address may be incorrect.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
            <ArrowLeft aria-hidden="true" size={16} />
            Return to sign in
          </Link>
          <Link href="/" className="rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">
            Go to home
          </Link>
        </div>
      </section>
    </main>
  );
}