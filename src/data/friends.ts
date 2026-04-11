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
    description: "\u957F\u98CE\u7834\u6D6A\u4F1A\u6709\u65F6\uFF0C\u76F4\u6302\u4E91\u5E06\u6D4E\u6CA7\u6D77\u3002",
    tags: ["\u751F\u6D3B", "\u968F\u7B14"],
    status: "active",
  },
];
