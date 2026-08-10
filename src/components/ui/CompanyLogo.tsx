import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { LOGO_PATH } from "../../constants/branding";

interface CompanyLogoProps {
  imgClassName?: string;
  iconClassName?: string;
}

export function CompanyLogo({ imgClassName = "w-10 h-10 object-contain", iconClassName = "w-6 h-6" }: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className={`inline-flex items-center justify-center rounded-xl bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 ${imgClassName}`}>
        <ShieldCheck className={iconClassName} />
      </span>
    );
  }
  return (
    <img
      src={LOGO_PATH}
      alt="ISCMS"
      className={imgClassName}
      onError={() => setFailed(true)}
    />
  );
}
