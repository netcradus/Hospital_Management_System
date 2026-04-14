import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-600">404</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-500">The route you requested is not configured yet.</p>
        <Link to="/" className="mt-6 inline-block text-brand-600">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;

