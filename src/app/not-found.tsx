import Link from 'next/link';


export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dia-canvas">
      <div className="text-center">
        <h1 className="text-6xl font-light text-foreground mb-4">404</h1>
        <p className="text-xl text-dia-body mb-8">Page not found</p>
        <Link
          href="/home"
          className="px-6 py-3 bg-foreground text-white font-medium rounded-dia-btn hover:bg-foreground/90 shadow-dia transition-all duration-300"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
