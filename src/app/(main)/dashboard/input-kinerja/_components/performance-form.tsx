"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { createPerformanceRecord } from "@/actions/performance";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { performanceFormSchema } from "@/lib/validation/performance";

type PerformanceFormValues = z.infer<typeof performanceFormSchema>;

interface PerformanceFormProps {
  stores: Array<{
    id: number;
    namaToko: string;
  }>;
}

export function PerformanceForm({ stores }: PerformanceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const defaultPeriode = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const form = useForm<PerformanceFormValues>({
    resolver: zodResolver(performanceFormSchema),
    mode: "onChange",
    defaultValues: {
      storeId: String(stores[0]?.id ?? ""),
      periode: defaultPeriode,
      targetSales: 0,
      actualSales: 0,
      totalOrder: 0,
      incompleteOrder: 0,
      slaOntime: 0,
    },
  });

  const values = form.watch();
  const isDomainValid = values.incompleteOrder <= values.totalOrder && values.slaOntime <= values.totalOrder;
  const isFormValid = form.formState.isValid && isDomainValid;

  const onSubmit = async (data: PerformanceFormValues) => {
    setLoading(true);

    const result = await createPerformanceRecord({
      ...data,
      storeId: Number(data.storeId),
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.message);
      if (result.errors) {
        const fields = Object.entries(result.errors) as Array<[keyof PerformanceFormValues, string[] | undefined]>;
        for (const [field, messages] of fields) {
          if (messages?.[0]) {
            form.setError(field, { message: messages[0] });
          }
        }
      }
      return;
    }

    toast.success(result.message);
    form.reset({
      storeId: String(stores[0]?.id ?? ""),
      periode: defaultPeriode,
      targetSales: 0,
      actualSales: 0,
      totalOrder: 0,
      incompleteOrder: 0,
      slaOntime: 0,
    });
    router.refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <FieldGroup>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="storeId"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="store-id">Toko</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="store-id" aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Pilih toko" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={String(store.id)}>
                        {store.namaToko}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="periode"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="periode">Periode (YYYY-MM)</FieldLabel>
                <Input
                  {...field}
                  id="periode"
                  placeholder="2024-01"
                  maxLength={7}
                  aria-invalid={fieldState.invalid}
                  disabled={loading}
                />
                <FieldDescription>Contoh: 2024-01 untuk Januari 2024.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="targetSales"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="target-sales">Target Penjualan</FieldLabel>
                <Input
                  id="target-sales"
                  type="number"
                  step="0.01"
                  min={0}
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    field.onChange(Number.isFinite(value) ? value : 0);
                  }}
                  aria-invalid={fieldState.invalid}
                  disabled={loading}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="actualSales"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="actual-sales">Penjualan Aktual</FieldLabel>
                <Input
                  id="actual-sales"
                  type="number"
                  step="0.01"
                  min={0}
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    field.onChange(Number.isFinite(value) ? value : 0);
                  }}
                  aria-invalid={fieldState.invalid}
                  disabled={loading}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Controller
            control={form.control}
            name="totalOrder"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="total-order">Total Order</FieldLabel>
                <Input
                  id="total-order"
                  type="number"
                  min={0}
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    field.onChange(Number.isFinite(value) ? Math.trunc(value) : 0);
                  }}
                  aria-invalid={fieldState.invalid}
                  disabled={loading}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="incompleteOrder"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="incomplete-order">Incomplete Order</FieldLabel>
                <Input
                  id="incomplete-order"
                  type="number"
                  min={0}
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    field.onChange(Number.isFinite(value) ? Math.trunc(value) : 0);
                  }}
                  aria-invalid={fieldState.invalid}
                  disabled={loading}
                  className={values.incompleteOrder > values.totalOrder ? "border-red-500" : ""}
                />
                {values.incompleteOrder > values.totalOrder && (
                  <FieldDescription className="text-destructive">
                    Tidak boleh lebih dari total order ({values.totalOrder}).
                  </FieldDescription>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="slaOntime"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="sla-ontime">SLA On-time</FieldLabel>
                <Input
                  id="sla-ontime"
                  type="number"
                  min={0}
                  value={Number.isFinite(field.value) ? field.value : 0}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    field.onChange(Number.isFinite(value) ? Math.trunc(value) : 0);
                  }}
                  aria-invalid={fieldState.invalid}
                  disabled={loading}
                  className={values.slaOntime > values.totalOrder ? "border-red-500" : ""}
                />
                {values.slaOntime > values.totalOrder && (
                  <FieldDescription className="text-destructive">
                    Tidak boleh lebih dari total order ({values.totalOrder}).
                  </FieldDescription>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !isFormValid}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() =>
            form.reset({
              storeId: String(stores[0]?.id ?? ""),
              periode: defaultPeriode,
              targetSales: 0,
              actualSales: 0,
              totalOrder: 0,
              incompleteOrder: 0,
              slaOntime: 0,
            })
          }
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
