import { companyIdentities, companyKeyForName, type CompanyIdentityKey } from "../../visuals/registry";

export function CompanyMark({ company, name, className = "" }: { company?: CompanyIdentityKey | string; name?: string; className?: string }) {
  const key = (company && company in companyIdentities ? company : companyKeyForName(name ?? company ?? "")) as CompanyIdentityKey | undefined;
  if (!key) throw new Error(`Missing company identity definition: ${name ?? company ?? ""}`);
  const identity = companyIdentities[key];
  return <span className={`company-mark ${className}`} style={{ color: identity.ink, backgroundColor: identity.paper }} aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d={identity.path} />
    </svg>
  </span>;
}
