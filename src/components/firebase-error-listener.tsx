'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { X, ShieldAlert, FileWarning } from 'lucide-react';
import { Button } from './ui/button';

export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (e: FirestorePermissionError) => {
      console.warn("Caught Firestore Permission Error:", e);
      setError(e);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development' || !error) {
    return null;
  }

  const operationTitle = {
    'read-one': 'Read Document',
    'read-list': 'Read Collection',
    'create': 'Create Document',
    'update': 'Update Document',
    'delete': 'Delete Document',
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-full max-w-lg rounded-lg border-2 border-destructive bg-background shadow-2xl">
      <div className="flex items-start justify-between bg-destructive p-3 text-destructive-foreground">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-6" />
          <div className="flex flex-col">
            <h2 className="font-bold">Firestore Security Rule Error</h2>
            <p className="text-sm">Missing or insufficient permissions.</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive-foreground hover:bg-destructive/80 hover:text-destructive-foreground"
          onClick={() => setError(null)}
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4 text-sm">
        <div>
          <h3 className="mb-1 font-semibold text-foreground">Operation Failed</h3>
          <p className="rounded-md bg-muted p-2 font-mono text-xs text-muted-foreground">
            {operationTitle[error.operation]} on path: <span className="font-bold text-foreground">{error.path}</span>
          </p>
        </div>

        <div>
          <h3 className="mb-1 font-semibold text-foreground">User Context</h3>
          <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
            <code>{JSON.stringify(error.authContext, null, 2)}</code>
          </pre>
        </div>

        {error.requestResource && (
          <div>
            <h3 className="mb-1 font-semibold text-foreground">Request Data</h3>
            <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
              <code>{JSON.stringify(error.requestResource, null, 2)}</code>
            </pre>
          </div>
        )}

        <div className="rounded-md border border-amber-500/50 bg-amber-50/50 p-3">
            <div className="flex items-center gap-2 text-amber-800">
                <FileWarning className="size-5"/>
                <h3 className="font-semibold">Next Step</h3>
            </div>
            <p className="mt-1 text-xs text-amber-700">
                Use the context above to update your Firestore security rules (`firestore.rules`) to allow this operation.
            </p>
        </div>
      </div>
    </div>
  );
}
