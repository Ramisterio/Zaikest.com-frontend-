export const metadata = {
  title: "Cart",
  description: "Your shopping cart page",
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-full">
      {children}
    </div>
  );
}
