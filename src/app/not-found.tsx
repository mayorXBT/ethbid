import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-[11px] uppercase tracking-[0.22em] text-bid">404</p>
      <h1 className="mt-3 text-3xl tracking-tight">Page not on the book.</h1>
      <Link href="/" className="mt-6 text-sm text-bid hover:underline">
        Back to Longbid
      </Link>
    </div>
  );
}
