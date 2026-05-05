"use client";

import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@frontend/components/ui/dialog";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@frontend/components/ui/radio-group";
import { Plus, FolderOpen, Loader2 } from "lucide-react";
import { useSavedCollections, useToggleSavePost } from "@frontend/hooks/use-saved-posts";
import { cn } from "@frontend/lib/utils";

const SYSTEM_DEFAULT_COLLECTION = "SYSTEM_DEFAULT_GENERAL";

const collectionSchema = z.string()
  .min(1, "Името е задължително")
  .max(50, "Името не може да надвишава 50 символа")
  .refine(val => val !== SYSTEM_DEFAULT_COLLECTION, {
    message: "Това име е запазено за системни цели."
  });

interface SavePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export function SavePostDialog({ open, onOpenChange, postId }: SavePostDialogProps) {
  const { data: collections } = useSavedCollections();
  const { mutate: savePost, isPending } = useToggleSavePost();
  
  const [selectedCollection, setSelectedCollection] = useState<string>(SYSTEM_DEFAULT_COLLECTION);
  const [isNew, setIsNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    let collectionToSend: string | null = selectedCollection;

    if (collectionToSend === SYSTEM_DEFAULT_COLLECTION) {
        collectionToSend = null;
    }

    if (isNew) {
      const validation = collectionSchema.safeParse(newCollectionName.trim());
      if (!validation.success) {
        setError(validation.error.issues[0].message);
        return;
      }
      collectionToSend = newCollectionName.trim();
    }

    savePost(
      { postId, collectionName: collectionToSend },
      {
        onSuccess: () => {
          onOpenChange(false);
          setNewCollectionName("");
          setIsNew(false);
          setSelectedCollection(SYSTEM_DEFAULT_COLLECTION);
          setError(null);
        }
      }
    );
  };

  const handleOpenChange = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
        setIsNew(false);
        setError(null);
        setNewCollectionName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Запазване в колекция</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!isNew && (
            <RadioGroup 
                value={selectedCollection} 
                onValueChange={setSelectedCollection} 
                className="gap-2 max-h-[250px] overflow-y-auto pr-1"
            >
              <div className={cn(
                  "flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedCollection === SYSTEM_DEFAULT_COLLECTION && "border-primary bg-primary/5"
              )}>
                <RadioGroupItem value={SYSTEM_DEFAULT_COLLECTION} id="r-general" />
                <Label htmlFor="r-general" className="flex-1 cursor-pointer flex items-center gap-2 font-medium">
                    <FolderOpen className="w-4 h-4 text-primary"/>
                    Всички (Общи)
                </Label>
              </div>
              
              {collections?.data?.filter(c => c.name !== SYSTEM_DEFAULT_COLLECTION).map((col) => (
                <div key={col.name} className={cn(
                    "flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    selectedCollection === col.name && "border-primary bg-primary/5"
                )}>
                    <RadioGroupItem value={col.name} id={`r-${col.name}`} />
                    <Label htmlFor={`r-${col.name}`} className="flex-1 cursor-pointer flex justify-between items-center">
                        <span className="truncate max-w-[200px]">{col.name}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {col.count}
                        </span>
                    </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {isNew ? (
            <div className="space-y-3 animate-in fade-in zoom-in-95 bg-muted/30 p-4 rounded-lg border">
                <Label htmlFor="new-col-input">Име на новата колекция</Label>
                <Input 
                    id="new-col-input"
                    placeholder="напр. Любими рецепти..." 
                    value={newCollectionName} 
                    onChange={(e) => {
                        setNewCollectionName(e.target.value);
                        if(error) setError(null);
                    }}
                    autoFocus
                    className={cn("bg-background", error && "border-destructive focus-visible:ring-destructive")}
                />
                {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
                
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => { setIsNew(false); setError(null); }} 
                    className="text-muted-foreground hover:text-foreground p-0 h-auto"
                >
                    ← Назад към списъка
                </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full mt-1 border-dashed" onClick={() => setIsNew(true)}>
              <Plus className="mr-2 h-4 w-4" /> Създай нова колекция
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={isPending || (isNew && !newCollectionName.trim())}
            className="w-full sm:w-auto"
          >
            {isPending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Запазване...
                </>
            ) : "Запази"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}