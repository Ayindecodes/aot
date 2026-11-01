import type { Metadata } from "next";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false },
};

export default function AdminPage() {
  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-4xl md:text-5xl">Admin</h1>
      <AdminApp />
    </div>
  );
}
