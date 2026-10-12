"use client";

interface StatusSelectorProps {
  currentStatus: string;
}

export function StatusSelector({ currentStatus }: StatusSelectorProps) {
  return (
    <select
      name="status"
      defaultValue={currentStatus}
      onChange={(e) => e.target.form?.requestSubmit()}
      style={{
        height: 38,
        padding: "0 10px",
        borderRadius: 8,
        border: "1px solid #dce2e2",
        background: "white",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      <option value="draft">Brouillon</option>
      <option value="published">Publiée</option>
      <option value="in_progress">En cours</option>
      <option value="closed">Clôturée</option>
      <option value="archived">Archivée</option>
    </select>
  );
}