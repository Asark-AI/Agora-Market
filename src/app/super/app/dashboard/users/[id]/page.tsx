import { redirect } from 'next/navigation';

export default function UserDetailsPage() {
  redirect('/super/app/dashboard?view=users');
}
