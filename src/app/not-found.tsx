import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-4xl sm:text-5xl">Page Not Found</h1>
      <p className="mt-4 text-muted">We couldn&apos;t find the page you were looking for.</p>
      <Link href="/shop" className="btn btn-primary mt-8">
        Shop the Collection
      </Link>
    </div>
  );
}
