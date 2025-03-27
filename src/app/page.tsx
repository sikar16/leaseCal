import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full pt-10 h-screen bg-gradient-to-br  bg-[#f7fafd]">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Simplify Your Equipment Leasing
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-xl text-gray-600">
            Streamline your leasing operations with our powerful management platform.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link href="/sign-in">
              <button className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 md:py-4 md:text-lg md:px-10 shadow-lg transition">
                Get Started
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="text-amber-600 mb-4">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Setup</h3>
            <p className="mt-2 text-gray-600">
              Get started in minutes with our intuitive interface.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="text-amber-600 mb-4">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Smart Analytics</h3>
            <p className="mt-2 text-gray-600">
              Real-time insights into your leasing portfolio.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
            <div className="text-amber-600 mb-4">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Secure</h3>
            <p className="mt-2 text-gray-600">
              Enterprise-grade security for your data.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} LeaserPro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
