export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 md:px-6 md:pt-12" aria-busy="true" aria-label="A carregar produtos">
      <div className="skeleton h-16 w-64 md:h-24" />
      <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5]" />
            <div className="skeleton mt-3 h-4 w-3/4" />
            <div className="skeleton mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
