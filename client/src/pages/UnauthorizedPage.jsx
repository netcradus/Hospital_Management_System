import { Link } from "react-router-dom";

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-center">
      <div>
        <h1 className="text-4xl font-semibold text-slate-900">Unauthorized</h1>
        <p className="mt-3 text-slate-500">You do not have permission to access this page.</p>
        <Link to="/auth/login" className="mt-6 inline-block text-brand-600">
          Return to login
        </Link>
      </div>
    </div>
  );
}

export default UnauthorizedPage;

