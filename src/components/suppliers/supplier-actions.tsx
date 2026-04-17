"use client";

import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export function SupplierActions({ supplier }: { supplier: any }) {
  return (
    <Button variant="outline" size="icon" disabled>
      <MoreHorizontal className="w-4 h-4" />
    </Button>
  );
}
