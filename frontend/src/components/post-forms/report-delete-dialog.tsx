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
import { useAdminResolveReport } from "@frontend/hooks/use-reports";
import { Loader2, Trash2 } from "lucide-react";

const deleteSchema = z.object({
    comment: z.string()
        .min(1, "Моля, въведете причина за изтриването на публикацията.")
        .max(500, "Причината не може да надвишава 500 символа.")
});

type DeleteFormValues = z.infer<typeof deleteSchema>;

interface ReportDeleteDialogProps {
    reportId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReportDeleteDialog({ reportId, open, onOpenChange }: ReportDeleteDialogProps) {
    const { mutate: resolveReport, isPending } = useAdminResolveReport();

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isValid }
    } = useForm<DeleteFormValues>({
        resolver: zodResolver(deleteSchema),
        defaultValues: { comment: "" },
        mode: "onChange"
    });

    const comment = watch("comment") || "";

    const onSubmit = (data: DeleteFormValues) => {
        resolveReport(
            {
                reportId,
                request: {
                    deletePost: true,
                    adminComment: data.comment.trim()
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
                    <DialogTitle className="flex items-center gap-2 text-red-500 text-xl font-bold">
                        <Trash2 className="h-6 w-6" />
                        Изтриване на публикация
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                        Тази публикация ще бъде премахната. Моля, опишете причината, тъй като тя ще бъде изпратена като известие до автора.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="py-2">
                    <div className="space-y-3 mb-6">
                        <Label htmlFor="comment" className="font-semibold text-sm">
                            Причина (Решение на администратор)
                        </Label>
                        <Textarea
                            id="comment"
                            placeholder="Напр. Публикацията нарушава правилата за спам и подвеждащо съдържание..."
                            {...register("comment")}
                            className="resize-none bg-muted/20 border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/60 break-all"
                            rows={4}
                            maxLength={500}
                        />
                        <div className="flex justify-between items-center text-xs px-1 min-h-[20px]">
                            {errors.comment ? (
                                <p className="text-rose-400">{errors.comment.message}</p>
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
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl w-full sm:w-auto ml-2 shadow-sm"
                        >
                            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Изтрий завинаги
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
