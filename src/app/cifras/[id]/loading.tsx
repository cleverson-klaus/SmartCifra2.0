export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 h-4 w-28 animate-pulse rounded bg-gray-800" />
      <div className="mb-8 flex items-start gap-4">
        <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-800" />
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-32 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-800" />
        </div>
      </div>
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-800" />
      <div className="mt-6 h-64 w-full animate-pulse rounded-xl bg-gray-900" />
    </div>
  );
}
