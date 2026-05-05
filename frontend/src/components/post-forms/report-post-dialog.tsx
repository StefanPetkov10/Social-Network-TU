"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@frontend/components/ui/dialog";
import { Button } from "@frontend/components/ui/button";
import { Textarea } from "@frontend/components/ui/textarea";
import { Label } from "@frontend/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@frontend/components/ui/radio-group";
import { useReportPost } from "@frontend/hooks/use-reports";
import { Loader2, AlertTriangle } from "lucide-react";

const reportSchema = z.object({
    reason: z.string().min(1, "Моля, изберете причина за докладване."),
    comment: z.string()
        .min(1, "Моля, напишете нещо.")
        .max(500, "Текстът не може да надвишава 500 символа.")
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportPostDialogProps {
    postId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReportPostDialog({ postId, open, onOpenChange }: ReportPostDialogProps) {
    const { mutate: submitReport, isPending } = useReportPost();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isValid }
    } = useForm<ReportFormValues>({
        resolver: zodResolver(reportSchema),
        defaultValues: { reason: "", comment: "" },
        mode: "onChange"
    });

    const reason = watch("reason");
    const comment = watch("comment") || "";

    const onSubmit = (data: ReportFormValues) => {
        submitReport(
            {
                postId,
                request: {
                    reasonType: parseInt(data.reason),
                    reasonComment: data.comment.trim()
                }
            },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                }
            }
        );
    };

    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            reset();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-500 text-xl">
                        <AlertTriangle className="h-6 w-6" />
                        Докладване на публикация
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Моля, изберете причина за докладване. Сигналите се преглеждат от нашите администратори и са напълно анонимни.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="py-2">
                    <div className="space-y-2 mb-4">
                        <RadioGroup
                            value={reason}
                            onValueChange={(val) => setValue("reason", val, { shouldValidate: true })}
                            className="space-y-2"
                        >
                            {[
                                { id: "1", label: "Спам или подвеждащо съдържание" },
                                { id: "2", label: "Тормоз или онлайн малтретиране" },
                                { id: "3", label: "Език на омразата или забранени символи" },
                                { id: "4", label: "Насилие или опасни организации" },
                                { id: "5", label: "Голота или сексуално съдържание" },
                                { id: "6", label: "Друго (опишете по-долу)" }
                            ].map((opt) => (
                                <div
                                    key={opt.id}
                                    className="flex items-center space-x-3 bg-muted/10 hover:bg-muted/40 p-3 rounded-xl border border-transparent transition-colors cursor-pointer"
                                >
                                    <RadioGroupItem value={opt.id} id={`r${opt.id}`} />
                                    <Label htmlFor={`r${opt.id}`} className="flex-1 cursor-pointer font-medium text-sm block">
                                        {opt.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                        <div className="min-h-[20px]">
                            {errors.reason && <p className="text-rose-500 text-xs px-1">{errors.reason.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2 mb-6">
                        <Label htmlFor="comment" className="font-semibold text-sm">Допълнително описание (задължително)</Label>
                        <Textarea
                            id="comment"
                            placeholder="Опишете накратко какъв е проблемът с тази публикация..."
                            {...register("comment")}
                            className="resize-none bg-muted/20 border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/60 break-all"
                            rows={5}
                            maxLength={500}
                        />
                        <div className="flex justify-between items-center text-xs px-1 min-h-[20px]">
                            {errors.comment ? (
                                <p className="text-rose-500">{errors.comment.message}</p>
                            ) : (
                                <span></span>
                            )}
                            <p className="text-muted-foreground">{comment.length}/500</p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isPending}
                            className="rounded-xl w-full sm:w-auto"
                        >
                            Отказ
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isValid || isPending}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl w-full sm:w-auto ml-2"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Изпрати сигнал
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}