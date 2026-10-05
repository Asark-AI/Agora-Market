import { redirect } from 'next/navigation';

export default function SellersPage() {
  redirect('/super/app/dashboard?view=sellers');
}
