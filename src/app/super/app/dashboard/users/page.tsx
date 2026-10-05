import { redirect } from 'next/navigation';

export default function UsersPage() {
  redirect('/super/app/dashboard?view=users');
}
