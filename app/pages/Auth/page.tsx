'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/pages/Auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center">
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white p-2 rounded-md font-semibold hover:bg-gray-800 transition-colors"
          >
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {isLogin ? (
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-black hover:underline font-medium"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-black hover:underline font-medium"
              >
                Login
              </button>
            </p>
          )}

          {!isLogin && (
            <div className="mt-4">
              <div className="relative flex items-center justify-center">
                <span className="absolute bg-white px-2 text-sm text-gray-500">Or</span>
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="mt-4 w-full flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-md font-semibold bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <img src="/google.svg" alt="Google logo" className="h-5 w-5" />
                Sign Up with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
