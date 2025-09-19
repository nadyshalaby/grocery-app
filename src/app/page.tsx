export default function Home() {
  return (
    <div className="min-h-screen p-8 font-mono">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Grocery List API</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">API Status</h2>
          <p className="mb-2">
            Health Check: <a href="/api/health" className="text-blue-600 hover:underline">/api/health</a>
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Available Endpoints</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold">Authentication</h3>
              <ul className="mt-2 space-y-1">
                <li>POST /api/auth/register - Register new user</li>
                <li>POST /api/auth/login - User login</li>
              </ul>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold">Grocery Items</h3>
              <ul className="mt-2 space-y-1">
                <li>GET /api/grocery-items - List all items</li>
                <li>POST /api/grocery-items - Create new item</li>
                <li>GET /api/grocery-items/:id - Get single item</li>
                <li>PUT /api/grocery-items/:id - Update item</li>
                <li>DELETE /api/grocery-items/:id - Delete item</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Documentation</h2>
          <p>
            For complete API documentation, see the{" "}
            <a
              href="https://github.com/yourusername/grocery-app#readme"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              README on GitHub
            </a>
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Testing</h2>
          <p className="mb-2">Run the test script:</p>
          <pre className="bg-gray-100 p-4 rounded">
            <code>./test-api.sh</code>
          </pre>
        </div>

        <footer className="mt-16 pt-8 border-t text-center text-gray-600">
          <p>Grocery List API v1.0.0</p>
        </footer>
      </main>
    </div>
  );
}