"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../../../context/CartContext";
import { Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import PromoPosters from "../../../components/PromoPosters";

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, increaseQuantity, decreaseQuantity, clearCart } = useCart();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-green-950">Your cart is empty</h1>
        <p className="text-[#5f6f61] mb-4">Looks like you have not added anything yet.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-800"
        >
          <ArrowLeft size={16} />
          Continue shopping
        </Link>
      </div>
    );
  }

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <div className="relative min-h-screen py-12 px-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center animate-hero-pan"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/70" aria-hidden />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)] animate-slide-up">
            Shopping Cart
          </h1>
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/orders"
              className="px-4 py-2 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800 transition"
            >
              My Orders
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-white/90 font-semibold hover:text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]"
            >
              <ArrowLeft size={16} />
              Continue shopping
            </Link>
          </div>
        </div>
        <div className="sm:hidden flex flex-wrap items-center gap-3 mb-6">
          <Link
            href="/orders"
            className="px-4 py-2 rounded-full bg-green-700 text-white font-semibold hover:bg-green-800 transition"
          >
            My Orders
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition"
          >
            <ArrowLeft size={16} />
            Continue shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            {cart.map((item) => (
              <div
                key={item._id}
                className="bg-white/90 rounded-2xl border border-green-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-lg transition animate-slide-up"
              >
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-green-950">{item.name}</h2>
                  <p className="text-[#5f6f61] font-medium mt-1">PKR {item.price}</p>

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => decreaseQuantity(item._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-green-100 text-lg font-bold hover:bg-green-700 hover:text-white transition"
                    >
                      -
                    </button>

                    <span className="min-w-[24px] text-center font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => increaseQuantity(item._id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-green-100 text-lg font-bold hover:bg-green-700 hover:text-white transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item._id)}
                  className="flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <Trash2 size={18} />
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white/90 rounded-2xl border border-green-100 p-6 shadow-sm h-fit">
            <h2 className="text-xl font-semibold text-green-950 mb-4">Order Summary</h2>
            <div className="flex justify-between text-sm text-[#5f6f61] mb-2">
              <span>Items</span>
              <span>{cart.length}</span>
            </div>
            <div className="flex justify-between text-sm text-[#5f6f61] mb-4">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-green-100 pt-4 mb-6">
              <span>Total</span>
              <span className="text-green-900">PKR {total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full px-6 py-3 rounded-full font-semibold transition transform hover:scale-[1.02]
                ${cart.length === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-700 text-white hover:bg-green-800"
                }`}
            >
              Proceed to Checkout
            </button>

            <button
              onClick={clearCart}
              className="w-full mt-3 bg-white border border-green-100 px-6 py-3 rounded-full font-semibold hover:border-green-300 transition"
            >
              Clear Cart
            </button>
          </div>
        </div>

        <div className="mt-8">
          <PromoPosters />
        </div>
      </div>
    </div>
  );
}

