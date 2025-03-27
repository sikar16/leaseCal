'use client';

import Link from 'next/link';
import { buttonVariants } from './ui/button';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const Navbar = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // Check auth status on component mount
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const { name, isAuthenticated } = JSON.parse(userData);
      if (isAuthenticated) {
        setIsLoggedIn(true);
        setUserName(name || 'User'); // Fallback to 'User' if name is missing
      }
    }
  }, []);

  // Handle sign-out
  const handleSignOut = () => {
    localStorage.removeItem('currentUser');
    setIsLoggedIn(false);
    toast.success('Signed out successfully');
    router.push('/');
    router.refresh(); // Ensure UI updates
  };

  return (
    <div className='bg-[#E2E8F0] py-4 border-b border-s-zinc-200 fixed w-full z-10 top-0'>
      <div className='container flex items-center justify-between'>
        <Link href='/'>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 14 14">
            <path fill="none" stroke="#373737" stroke-linecap="round" stroke-linejoin="round" d="M11.5.5h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2M7 .5v13M.5 7h13m-11-3.25H5m4.25 0h2m-2 5.5h2m-2 2h2M3.75 2.5V5M2.69 9.19l2.12 2.12m0-2.12l-2.12 2.12" stroke-width="1" />
          </svg>
        </Link>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <span className="text-sm font-medium text-gray-700">
                Hello, {userName}
              </span>
              <button
                onClick={handleSignOut}
                className={buttonVariants({ variant: 'outline' })}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link className={buttonVariants()} href='/sign-in'>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;