export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">The page you are looking for does not exist.</p>
      <a href="/" className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">
        Back to home
      </a>
    </div>
  );
}
