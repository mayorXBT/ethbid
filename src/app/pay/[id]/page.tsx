import { Checkout } from "@/components/checkout";
import { Header } from "@/components/header";
import { getBid } from "@/lib/store";
import { preparePayment } from "@/lib/settle";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await getBid(id);
  if (!loaded) notFound();
  const { bid } = await preparePayment(loaded);

  return (
    <div>
      <Header />
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="text-[11px] uppercase tracking-[0.28em] text-bid">Settle in USDC</p>
        <h1 className="mt-3 text-3xl tracking-tight">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pay with MoonPay or send USDC directly. Rank writes when the payment confirms.
        </p>
        <div className="mt-8">
          <Checkout bid={bid} />
        </div>
        <Link href="/" className="mt-8 inline-block font-mono text-[11px] uppercase tracking-[0.18em] text-mute hover:text-ink">
          ← Cancel, keep my money
        </Link>
      </main>
    </div>
  );
}
