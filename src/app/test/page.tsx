// src/app/test/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function TestPage() {
  const supabase = await createClient();
  
  // Test database connection
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(1);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      {error ? (
        <div className="text-red-500">
          <p>❌ Error: {error.message}</p>
        </div>
      ) : (
        <div className="text-green-500">
          <p>✅ Connected successfully!</p>
          <p className="text-gray-600 mt-2">
            Questions found: {questions?.length || 0}
          </p>
          <pre className="mt-4 p-4 bg-gray-100 rounded text-xs">
            {JSON.stringify(questions, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}