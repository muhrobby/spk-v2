"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateWeightsAction } from "@/actions/weights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const weightFormSchema = z.object({
  weights: z.array(
    z.object({
      id: z.number().int().positive(),
      kode: z.enum(["C1", "C2", "C3"]),
      namaKriteria: z.string(),
      tipe: z.enum(["benefit", "cost"]),
      bobot: z.number().min(0, "Minimal 0").max(100, "Maksimal 100"),
    }),
  ),
});

type WeightFormValues = z.infer<typeof weightFormSchema>;

type WeightFormRow = WeightFormValues["weights"][number];

type WeightsFormProps = {
  initialWeights: WeightFormRow[];
};

export function WeightsForm({ initialWeights }: WeightsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WeightFormValues>({
    resolver: zodResolver(weightFormSchema),
    mode: "onChange",
    defaultValues: {
      weights: initialWeights,
    },
  });

  const watchedWeights = form.watch("weights");

  const totalWeight = useMemo(
    () => watchedWeights.reduce((sum, item) => sum + (Number.isFinite(item.bobot) ? item.bobot : 0), 0),
    [watchedWeights],
  );

  const isTotalValid = Math.abs(totalWeight - 100) < 0.001;

  const onSubmit = async (values: WeightFormValues) => {
    if (!isTotalValid) {
      toast.error("Total bobot harus tepat 100.");
      return;
    }

    setIsSubmitting(true);
    const result = await updateWeightsAction({
      weights: values.weights.map((item) => ({
        id: item.id,
        kode: item.kode,
        bobot: item.bobot,
      })),
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.refresh();
  };

  return (
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        {watchedWeights.map((weight, index) => (
          <div key={weight.id} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {weight.kode} — {weight.namaKriteria}
                </p>
              </div>
              <Badge variant={weight.tipe === "benefit" ? "default" : "secondary"}>{weight.tipe}</Badge>
            </div>

            <Controller
              control={form.control}
              name={`weights.${index}.bobot`}
              render={({ field, fieldState }) => (
                <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`bobot-${weight.id}`}>Bobot (%)</FieldLabel>
                  <Input
                    id={`bobot-${weight.id}`}
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      field.onChange(Number.isFinite(value) ? value : 0);
                    }}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        ))}
      </FieldGroup>

      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
        <p className="font-medium text-sm">Total Bobot</p>
        <Badge variant={isTotalValid ? "default" : "destructive"}>{totalWeight.toFixed(2)}</Badge>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !isTotalValid || !form.formState.isValid}
        className="w-full sm:w-auto"
      >
        Simpan Bobot
      </Button>
    </form>
  );
}
