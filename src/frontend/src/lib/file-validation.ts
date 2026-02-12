export const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp",

  "mp4", "avi", "mov", 

  "pdf", "doc", "docx", "txt", "rtf",
  "ppt", "pptx", "odp",
  "xls", "xlsx", "csv", "ods",
  "zip", "rar", "7z",
  "gif"
];

export const MAX_CHAT_FILES = 10; //chat
export const MAX_CHAT_SIZE_MB = 25;

export const validateFile = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false;
};