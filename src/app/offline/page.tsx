export default function OfflinePage() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-700 text-xl font-extrabold text-white">
        AG
      </div>
      <h1 className="mt-4 text-2xl font-bold">You are offline</h1>
      <p className="mx-auto mt-2 max-w-md text-muted">
        No internet connection right now. Your cart is saved on this device — reconnect and it will still be here.
      </p>
      <a href="/" className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">
        Try again
      </a>
    </div>
  );
}
