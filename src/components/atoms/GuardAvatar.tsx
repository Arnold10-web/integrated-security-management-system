import React from "react";

interface GuardAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

export const GuardAvatar: React.FC<GuardAvatarProps> = ({ name, size = "sm" }) => {
  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 border border-slate-200`}
    >
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
};
