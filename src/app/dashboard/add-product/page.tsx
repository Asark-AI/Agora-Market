'use client';

import { useAuth } from "@/hooks/use-auth";
import { AddProductForm } from "@/components/add-product-form";

export default function AddProductPage() {
  const { seller } = useAuth();
  
  if (!seller) return null; // Or a loading state


  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-headline">
          Add a New Product
        </h1>
        <p className="text-muted-foreground mt-1">
          Follow the steps below to add a new product to your business.
        </p>
      </div>
      <AddProductForm />
    </div>
  );
}
