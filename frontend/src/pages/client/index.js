import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ClientPortalRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/client-portal');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Redirecting to the Client Portal...
    </div>
  );
}
