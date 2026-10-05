import { redirect } from 'next/navigation';

export default function ProductsPage() {
  redirect('/super/app/dashboard?view=products');
}
