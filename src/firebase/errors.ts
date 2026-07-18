
import { getAuth } from 'firebase/auth';
import type { CollectionReference, DocumentReference } from 'firebase/firestore';

export type FirestoreOperation = 'read-one' | 'read-list' | 'create' | 'update' | 'delete';

export type SecurityRuleContext = {
    path: string;
    operation: FirestoreOperation;
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  path: string;
  operation: FirestoreOperation;
  authContext: object | null;
  requestResource?: object;
  
  constructor(context: SecurityRuleContext, serverError: Error) {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const authContext = currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
          name: currentUser.displayName,
          token: currentUser.toJSON(),
        }
      : null;

    const message = `
FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(
  {
    auth: authContext,
    operation: context.operation,
    path: context.path,
    requestData: context.requestResourceData,
  },
  null,
  2
)}
`;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.path = context.path;
    this.operation = context.operation;
    this.requestResource = context.requestResourceData;
    this.authContext = authContext;

    // Preserve the original error's stack trace
    this.stack = serverError.stack;
  }
}
