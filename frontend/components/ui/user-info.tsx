import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type UserInfoUser = {
  name: string;
  email: string;
  avatar?: string;
};

export function UserInfo({
  user,
  showEmail = false,
}: {
  user: UserInfoUser;
  showEmail?: boolean;
}) {
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BP";

  return (
    <>
      <Avatar className="h-8 w-8 overflow-hidden rounded-full">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="rounded-full bg-[#C8D9E6] font-semibold text-[#2F4156]">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail && (
          <span className="truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        )}
      </div>
    </>
  );
}
