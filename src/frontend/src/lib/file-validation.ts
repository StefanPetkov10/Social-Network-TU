export const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp", 
  "mp4", "avi", "mov", 
  "pdf", "docx", "txt", "doc", "ppt", "pptx",
  "gif"
];

export const validateFile = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false;
};