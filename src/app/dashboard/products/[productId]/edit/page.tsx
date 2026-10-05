'use client';

import { EditProductForm } from "@/components/edit-product-form";
import { useParams } from "next/navigation";

export default function EditProductPage() {
  const params = useParams<{ productId: string }>();
  const { productId } = params;
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">
          Edit Product
        </h1>
        <p className="text-muted-foreground mt-1">
          Make changes to your product information and save them.
        </p>
      </div>
      <EditProductForm productId={productId} />
    </div>
  );
}
