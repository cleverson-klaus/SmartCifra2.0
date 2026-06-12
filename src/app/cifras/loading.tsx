export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-gray-800" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="mb-8 h-11 w-full animate-pulse rounded-xl bg-gray-800" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-900" />
        ))}
      </div>
    </div>
  );
}
