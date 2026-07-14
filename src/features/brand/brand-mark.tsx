import Image from "next/image";

export function BrandMark() {
  return (
    <div className="brand-lockup">
      <Image src="/brand/itu-eaccess-mark.svg" alt="ITU eAccess" width={82} height={82} priority className="brand-lockup__mark" />
      <span className="brand-lockup__wordmark" aria-hidden="true"><span>ITU</span> <strong>eAccess</strong></span>
    </div>
  );
}
