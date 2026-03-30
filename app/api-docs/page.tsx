'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { useEffect, useState } from 'react';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Detecta a URL atual para exibir ao usuário
    setUrl(window.location.origin);
    
    fetch('/api/swagger')
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 text-white px-4 py-2 text-sm">
        <span className="font-semibold">Servidor atual:</span> {url}/api
      </div>
      <SwaggerUI spec={spec} docExpansion="list" />
    </div>
  );
}
