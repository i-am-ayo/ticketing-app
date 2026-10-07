import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      event: true,
      items: {
        include: {
          ticketType: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const expiresAt = new Date(order.createdAt.getTime() + 15 * 60 * 1000);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-6">
          <div>
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 mb-2">
              Reservation Reserved ({order.status})
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              {order.event.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">Order ID: {order.id}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl bg-amber-50/60 border border-amber-200/80 p-4">
            <h2 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Complete Payment Notice
            </h2>
            <p className="text-xs text-amber-700 mt-1">
              Your tickets are reserved for 15 minutes. Please complete payment
              before <strong>{expiresAt.toLocaleTimeString()}</strong>.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Customer Details
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium text-gray-900">
                {order.buyerName}
              </span>
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium text-gray-900">
                {order.buyerPhone}
              </span>
              {order.buyerEmail && (
                <>
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium text-gray-900">
                    {order.buyerEmail}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Reserved Items
            </h3>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span className="text-gray-700">
                  {item.quantity}x {item.ticketType.name}
                </span>
                <span className="font-semibold text-gray-900">
                  {order.currency} {item.unitPrice * item.quantity}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-3 mt-2 border-t border-gray-100">
              <span>Total Amount</span>
              <span className="text-amber-600">
                {order.currency} {order.totalAmount}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button
            disabled
            className="w-full rounded-xl bg-gray-200 py-3 font-semibold text-gray-500 cursor-not-allowed text-center text-sm"
          >
            Pay with EcoCash / Card (Stage 5 Integration)
          </button>
        </div>
      </div>
    </main>
  );
}
