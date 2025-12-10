"use client";

import { useState, useRef } from "react";
import { 
  Image as ImageIcon, 
  FileText, 
  X, 
  Globe, 
  Users, 
  Lock, 
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";
import { Button } from "@frontend/components/ui/button";
import { Separator } from "@frontend/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@frontend/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@frontend/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@frontend/components/ui/select";
import { Textarea } from "@frontend/components/ui/textarea";
import { ScrollArea } from "@frontend/components/ui/scroll-area";
import { useCreatePost } from "@frontend/hooks/use-create-post";
import { validateFile } from "@frontend/lib/file-validation";
import { toast } from "sonner";

interface CreatePostProps {
  user: {
    firstName: string;
    lastName: string;
    photo: string | null;
  };
}

export function CreatePost({ user }: CreatePostProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState("0"); 
  
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: createPost, isPending } = useCreatePost();

  const displayName = `${user.firstName} ${user.lastName}`;
  const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();

  const handleOpen = (triggerType: "text" | "media" | "doc") => {
    setIsOpen(true);
    setTimeout(() => {
        if (triggerType === "media") mediaInputRef.current?.click();
        if (triggerType === "doc") docInputRef.current?.click();
    }, 100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];

      selectedFiles.forEach((file) => {
        if (validateFile(file)) {
          validFiles.push(file);
        } else {
          toast.error(`Файлът "${file.name}" не се поддържа.`);
        }
      });

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
      e.target.value = ""; 
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim() && files.length === 0) return;

    const formData = new FormData();
    formData.append("Content", content);
    formData.append("Visibility", visibility);
    
    files.forEach((file) => {
        formData.append("Files", file);
    });

    createPost(formData, {
        onSuccess: () => {
            setIsOpen(false);
            setContent("");
            setFiles([]);
        }
    });
  };

  return (
    <>
    <div className="bg-background rounded-xl border p-4 shadow-sm mb-6">
      <div className="flex gap-3 mb-4">
        <Avatar>
          <AvatarImage src={user.photo || ""} />
          <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
        </Avatar>
        <button 
            onClick={() => handleOpen("text")}
            className="flex-1 text-left bg-muted/50 hover:bg-muted rounded-full px-4 py-2 text-muted-foreground transition-colors cursor-pointer text-sm sm:text-base"
        >
          За какво си мислите, {user.firstName}?
        </button>
      </div>

      <Separator className="mb-3" />

      <div className="flex justify-between px-2 sm:px-8">
        <Button 
            variant="ghost" 
            className="flex-1 gap-2 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            onClick={() => handleOpen("media")}
        >
          <ImageIcon className="h-5 w-5 text-green-500" />
          <span className="hidden sm:inline">Снимка/Видео</span>
          <span className="sm:hidden">Медия</span>
        </Button>
        
        <Button 
            variant="ghost" 
            className="flex-1 gap-2 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            onClick={() => handleOpen("doc")}
        >
          <FileText className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">Качи Документ</span>
          <span className="sm:hidden">Документ</span>
        </Button>
      </div>
    </div>

    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden bg-background">
        
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-center w-full font-bold text-lg">Създаване на публикация</DialogTitle>
        </DialogHeader>

        <div className="p-4 flex gap-3">
          <Avatar>
            <AvatarImage src={user.photo || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold text-sm">{displayName}</div>
            
            <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="h-6 text-xs bg-muted/50 border-none px-2 py-0 mt-1 w-fit gap-1 rounded-md">
                   <div className="flex items-center">
                        <SelectValue />
                   </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="0"><div className="flex items-center"><Globe className="h-4 w-4 mr-2"/> Публично</div></SelectItem>
                    <SelectItem value="1"><div className="flex items-center"><Users className="h-4 w-4 mr-2"/> Приятели</div></SelectItem>
                    <SelectItem value="2"><div className="flex items-center"><Lock className="h-4 w-4 mr-2"/> Само аз</div></SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh] px-4">
            <Textarea 
                placeholder={`За какво си мислите, ${user.firstName}?`}
                className="min-h-[100px] text-lg border-none focus-visible:ring-0 resize-none p-0 placeholder:text-muted-foreground/70"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            {files.length > 0 && (
                <div className="mt-4 mb-2 grid grid-cols-1 gap-2 border rounded-lg p-2 relative">
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        className="absolute top-4 right-4 z-10 rounded-full h-8 w-8 bg-background/80 hover:bg-background"
                        onClick={() => setFiles([])}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                        {files.map((file, i) => (
                            <div key={i} className="relative group rounded-md overflow-hidden border bg-muted/20">
                                {file.type.startsWith("image/") ? (
                                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-auto object-cover max-h-[300px]" />
                                ) : file.type.startsWith("video/") ? (
                                    <video src={URL.createObjectURL(file)} controls className="w-full max-h-[300px]" />
                                ) : (
                                    <div className="flex items-center p-4 gap-3">
                                        <div className="bg-red-100 p-2 rounded text-red-600"><FileText className="h-6 w-6"/></div>
                                        <div className="flex-1 truncate font-medium">{file.name}</div>
                                        <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                    </div>
                                )}
                                
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeFile(i)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ScrollArea>

        <div className="px-4 py-3">
            <div className="border rounded-lg p-3 flex items-center justify-between shadow-sm">
                <span className="font-semibold text-sm pl-1">Добавете към публикацията</span>
                
                <div className="flex gap-1">
                    <TooltipButton icon={<ImageIcon className="text-green-500" />} onClick={() => mediaInputRef.current?.click()} tooltip="Снимка/Видео" />
                    
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-purple-500 hover:bg-purple-50">
                                <span className="font-bold text-xs border border-current rounded px-1">GIF</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="end">
                            <div className="p-3 border-b font-semibold text-sm">Избери GIF</div>
                            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm bg-muted/20">
                                GIPHY интеграция - скоро... 🚀
                            </div>
                        </PopoverContent>
                    </Popover>

                    <TooltipButton icon={<FileText className="text-orange-500" />} onClick={() => docInputRef.current?.click()} tooltip="Документ" />
                </div>
            </div>
        </div>

        <div className="p-4 pt-0">
            <Button 
                className="w-full text-base font-semibold py-5" 
                disabled={(!content && files.length === 0) || isPending}
                onClick={handleSubmit}
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Публикуване...
                    </>
                ) : "Публикуване"}
            </Button>
        </div>

        <input 
            type="file" 
            ref={mediaInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            multiple 
            onChange={handleFileChange} 
        />
        <input 
            type="file" 
            ref={docInputRef} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.txt" 
            multiple 
            onChange={handleFileChange} 
        />

      </DialogContent>
    </Dialog>
    </>
  );
}

function TooltipButton({ icon, onClick, tooltip }: { icon: React.ReactNode, onClick?: () => void, tooltip: string }) {
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-full hover:bg-muted"
            onClick={onClick}
            title={tooltip}
        >
            {icon}
        </Button>
    )
}