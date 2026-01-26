import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@frontend/components/ui/dialog";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import { Textarea } from "@frontend/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@frontend/components/ui/select";
import { Loader2, Upload, AlertCircle } from "lucide-react"; 
import { ProfileDto, UpdateProfileDto } from "@frontend/lib/types/profile";
import { Gender } from "@frontend/lib/types/enums";
import { useEditProfile } from "@frontend/hooks/use-profile";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/components/ui/avatar";

interface EditProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    profile: ProfileDto;
}

export function EditProfileDialog({ isOpen, onClose, profile }: EditProfileDialogProps) {
    const { mutate: editProfile, isPending } = useEditProfile();
    
    const [formData, setFormData] = useState<UpdateProfileDto>({
        firstName: "",
        lastName: "",
        username: "",
        bio: "",
        sex: Gender.Male,
        photoBase64: null
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [bioError, setBioError] = useState<string | null>(null); 

    const MAX_BIO_LENGTH = 100;

    useEffect(() => {
        if (isOpen && profile) {
            setFormData({
                firstName: profile.firstName || "",
                lastName: profile.lastName || "",
                username: profile.username || "", 
                bio: profile.bio || "",
                sex: profile.sex === Gender.Female ? Gender.Female : Gender.Male, 
                photoBase64: null
            });
            setPreviewImage(profile.authorAvatar || null);
            setBioError(null); 
        }
    }, [isOpen, profile]);

    const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setFormData({...formData, bio: val});
        
        if (val.length > MAX_BIO_LENGTH) {
            setBioError(`Описанието не може да надвишава ${MAX_BIO_LENGTH} символа.`);
        } else {
            setBioError(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewImage(base64String);
                setFormData(prev => ({ ...prev, photoBase64: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.bio && formData.bio.length > MAX_BIO_LENGTH) return;

        editProfile(formData, {
            onSuccess: () => {
                onClose();
            },
            onError: (err) => {
               console.error("Грешка при редакция:", err);
            }
        });
    };

    const currentBioLength = formData.bio?.length || 0;
    const isOverLimit = currentBioLength > MAX_BIO_LENGTH;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Редактиране на профил</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-24 w-24 border-2">
                            <AvatarImage src={previewImage || ""} className="object-cover" />
                            <AvatarFallback>{profile.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="avatar-upload" className="cursor-pointer bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                                <Upload className="w-4 h-4" />
                                Качи нова снимка
                            </Label>
                            <Input 
                                id="avatar-upload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleFileChange} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Име</Label>
                            <Input 
                                id="firstName" 
                                value={formData.firstName} 
                                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Фамилия</Label>
                            <Input 
                                id="lastName" 
                                value={formData.lastName} 
                                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">Потребителско име</Label>
                        <Input 
                            id="username" 
                            value={formData.username} 
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Това е уникалното ви име в системата (@име).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="sex">Пол</Label>
                        <Select 
                            value={formData.sex.toString()} 
                            onValueChange={(val) => setFormData({...formData, sex: Number(val) as Gender})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Избери пол" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={Gender.Male.toString()}>Мъж</SelectItem>
                                <SelectItem value={Gender.Female.toString()}>Жела</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="bio">Биография</Label>
                            <span className={`text-xs ${isOverLimit ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                                {currentBioLength}/{MAX_BIO_LENGTH}
                            </span>
                        </div>
                        <Textarea 
                            id="bio" 
                            placeholder="Разкажете малко за себе си..."
                            value={formData.bio} 
                            onChange={handleBioChange}
                            className={`resize-none h-24 ${isOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                        {isOverLimit && (
                            <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>{bioError}</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Отказ
                        </Button>
                        <Button type="submit" disabled={isPending || isOverLimit}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Запази промените
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}