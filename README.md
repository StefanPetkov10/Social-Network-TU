# \# 🎓 University Social Network

# 

# A modern web-based social platform designed specifically for \*\*university communities\*\*. Inspired by Facebook’s core features but tailored for academic collaboration, this system enables students, faculty, and staff to \*\*communicate, share resources, and build meaningful academic and social connections\*\* — all in a secure and private environment.

# 

# ---

# 

# \## ✨ Features

# 

# \- \*\*User accounts\*\* with university-based email registration and optional two-factor authentication (2FA)

# \- \*\*Profile management\*\* with editable details and avatars

# \- \*\*Posts\*\*:

# &nbsp; - Public posts (visible to all)

# &nbsp; - Friends-only posts

# &nbsp; - Group-specific posts

# \- \*\*Comments and likes\*\* on posts

# \- \*\*Friend system\*\* (two-way approval)

# \- \*\*Interest-based groups\*\* (open or private)

# \- \*\*Private messaging system\*\* with real-time chat (SignalR)

# \- \*\*Search engine\*\* (text-based, with semantic search via pgVector planned)

# \- \*\*Real-time notifications\*\*

# \- \*\*Admin dashboard\*\* for moderation and user/group management

# \- \*\*Strong security\*\*:

# &nbsp; - JWT authentication

# &nbsp; - HTTPS

# &nbsp; - XSS/CSRF/SQLi protection

# &nbsp; - Password hashing and message encryption

# 

# ---

# 

# \## 🧱 Tech Stack

# 

# | Layer         | Technologies                                               |

# |---------------|------------------------------------------------------------|

# | \*\*Frontend\*\*  | React 18 + Next.js 13 (TypeScript), Tailwind CSS, shadcn/ui |

# | \*\*Backend\*\*   | ASP.NET Core 8 Web API, SignalR, Entity Framework Core   |

# | \*\*Database\*\*  | PostgreSQL 15+, pgVector                                   |

# | \*\*Storage\*\*   | MinIO (S3-compatible object storage)                       |

# | \*\*Auth\*\*      | ASP.NET Identity, JWT, TOTP-based 2FA                      |

# | \*\*DevOps\*\*    | Docker, Docker Compose, GitHub Actions, Swagger/OpenAPI   |

# 

# ---

# 

# \## 🧭 Architecture Overview

# 

# \- \*\*Client (Next.js)\*\*: Provides all UI and handles routing, authentication, posting, chat, and group interactions.

# \- \*\*API (ASP.NET Core)\*\*: Exposes RESTful endpoints and handles core business logic, security, notifications, and real-time features (SignalR).

# \- \*\*Database (PostgreSQL)\*\*: Stores users, posts, comments, friendships, group memberships, messages, notifications.

# \- \*\*Object Storage (MinIO)\*\*: Used for uploading and serving files (images, documents, videos).

# \- \*\*WebSockets (SignalR)\*\*: Enables instant messaging and live notifications.

# 

# ---

# 

# \## 🧪 Key Functional Modules

# 

# \- \*\*Authentication \& Roles\*\*: University email registration, JWT tokens, 2FA, user/admin roles.

# \- \*\*Posts \& Feeds\*\*: Visibility-controlled posts, image/video attachments, group-specific threads.

# \- \*\*Friends System\*\*: Send/accept/reject friend requests; filter visibility accordingly.

# \- \*\*Groups\*\*: Create/join open or private groups. Each has its own post feed.

# \- \*\*Comments \& Likes\*\*: Engage with posts via threaded comments and reactions.

# \- \*\*Chat\*\*: Real-time 1-on-1 or group chat with message encryption support.

# \- \*\*Search\*\*: Basic keyword search (pgVector-powered semantic search in later phases).

# \- \*\*Admin Panel\*\*: Manage users, posts, and groups with limited access to private content.

# \- \*\*Notifications\*\*: Receive alerts for new messages, friend requests, group activity, etc.

# 

# ---



