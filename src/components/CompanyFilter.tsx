"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Company {
  id: string;
  name: string;
}

export function CompanyFilter({
  companies,
  defaultValue = "",
  placeholder = "Toutes les sociétés",
}: {
  companies: Company[];
  defaultValue?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (newId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newId) {
      params.set("companyId", newId);
    } else {
      params.delete("companyId");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      defaultValue={defaultValue}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        height: 40,
        padding: "0 14px",
        borderRadius: 8,
        border: "1px solid #dce2e2",
        background: "white",
        fontSize: 13,
        color: "#34485a",
        cursor: "pointer",
      }}
    >
      <option value="">{placeholder}</option>
      {companies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}