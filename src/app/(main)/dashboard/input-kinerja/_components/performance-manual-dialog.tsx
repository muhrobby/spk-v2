"use client";

import { useState } from "react";

import { FilePenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { PerformanceForm } from "./performance-form";

type StoreOption = {
  id: number;
  namaToko: string;
};

interface PerformanceManualDialogProps {
  stores: StoreOption[];
}

export function PerformanceManualDialog({ stores }: PerformanceManualDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <FilePenLine className="mr-1.5 size-4" />
          Input Manual
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Input Kinerja Manual</DialogTitle>
          <DialogDescription>
            Pilih periode, pilih toko, lalu isi metrik kinerja bulanan secara manual.
          </DialogDescription>
        </DialogHeader>

        <PerformanceForm stores={stores} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
