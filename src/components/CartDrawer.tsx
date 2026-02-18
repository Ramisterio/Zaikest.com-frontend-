"use client";

import Link from "next/link";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div
      className={`fixed inset-0 z-[60] transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-green-100 shrink-0">
          <div className="flex items-center gap-2 text-green-950 font-semibold">
            <ShoppingBag size={18} />
            Your Cart
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full border border-green-100 bg-gray-200 hover:bg-gray-300 hover:border-green-300 transition"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-auto flex-1">
          {cart.length === 0 ? (
            <div className="text-center text-[#5f6f61] py-10">
              Your cart is empty.
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-4 border border-green-100 rounded-2xl p-3 bg-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-green-950">{item.name}</p>
                    <p className="text-sm text-[#5f6f61]">PKR {item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => decreaseQuantity(item._id)}
                        className="w-7 h-7 rounded-full border border-green-100 text-black flex items-center justify-center hover:bg-green-700 hover:text-white transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[20px] text-center text-sm font-semibold text-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item._id)}
                        className="w-7 h-7 rounded-full border border-green-100 text-black flex items-center justify-center hover:bg-green-700 hover:text-white transition"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-xs font-semibold text-green-600 hover:text-green-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-5 border-t border-green-100 shrink-0">
          <div className="flex items-center justify-between font-semibold text-green-950 mb-4">
            <span>Subtotal</span>
            <span>PKR {total.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/cart"
              onClick={onClose}
              className="w-full text-center rounded-full border border-green-200 py-3 font-semibold text-green-900 hover:border-green-400 transition"
            >
              View Cart
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="w-full text-center rounded-full bg-green-700 text-white py-3 font-semibold hover:bg-green-800 transition"
            >
              Checkout
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

