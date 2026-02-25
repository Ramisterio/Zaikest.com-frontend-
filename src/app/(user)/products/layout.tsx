export const metadata = {
  title: "Products | Zaikest",
  description: "Browse fresh products, dishes, pastes, and spices on Zaikest.",
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-full">
      {children}
    </div>
  );
}
