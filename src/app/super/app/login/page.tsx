import { redirect } from 'next/navigation';

export default function SuperAppLoginRedirect() {
  redirect('/admin/sign-in');
}
