import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { eden } from '@/lib/api';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await eden.api.health.get();
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-500">Error fetching health check</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Budgeteer</h1>
        <p className="mt-4 text-lg text-gray-600">
          Status: <span className="font-mono text-green-600">{data?.status}</span>
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Server time: {data?.timestamp}
        </p>
      </div>
    </div>
  );
}
