export const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp",

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

export const getYouTubeEmbedUrl = (url?: string | null) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};