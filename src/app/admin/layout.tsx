"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "lucide-react";
import AdminGuard from "../../components/guards/AdminGuard";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Users", path: "/admin/users" },
    { name: "Products", path: "/admin/products" },
    { name: "Stock", path: "/admin/stock" },
    { name: "Categories", path: "/admin/categories" },
    { name: "Orders", path: "/admin/orders" },
  ];

  const handleLogout = async () => {
    await logout();
    router.replace("/"); // ✅ clean exit
  };

  return (
    <AdminGuard>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 text-white flex flex-col">
          <div className="p-6 border-b border-gray-700">
            <div className="text-2xl font-bold">Admin Panel</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                <User size={16} />
              </span>
              <span className="truncate">
                {user?.name || user?.email || "Admin"}
              </span>
            </div>
          </div>

          <nav className="flex-1 mt-4">
            <ul>
              {menuItems.map((item) => (
                <li
                  key={item.path}
                  className={`p-4 hover:bg-gray-700 transition ${
                    pathname === item.path ? "bg-gray-700 font-bold" : ""
                  }`}
                >
                  <Link href={item.path} prefetch={false}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full text-center text-white bg-red-900/80 hover:bg-red-900 px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
