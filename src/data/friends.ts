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
    description: "长风破浪会有时，直挂云帆济沧海。",
    tags: ["生活", "随笔"],
    status: "active",
  },
];
