import { redirect } from 'next/navigation';

export default function SuperAppLoginRedirect() {
  redirect('/sign-in?next=%2Fsuper%2Fapp%2Fdashboard');
}
