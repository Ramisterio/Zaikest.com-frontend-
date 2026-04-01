import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}

