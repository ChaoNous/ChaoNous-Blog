interface FriendLink {
  name: string;
  url: string;
  avatar: string;
  description: string;
  tags?: string[];
  screenshot?: string;
  status?: "active" | "inactive" | "error";
  createdAt?: string;
}

export const friendsData: FriendLink[] = [
  {
    name: "ChaoNous",
    url: "https://chaonous.com",
    avatar: "/assets/images/avatar.webp",
    description: "人是万物的尺度。",
    tags: ["生活", "随笔"],
    status: "active",
  },
];
