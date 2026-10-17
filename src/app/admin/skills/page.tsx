import { db } from "@/db/client";
import { skills } from "@/db/schema";
import { createSkill, updateSkill, deleteSkill } from "../actions";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";
import { Badge } from "@/components/admin/ui";
import { type AdminField } from "@/components/admin/RecordFormDialog";

export const dynamic = "force-dynamic";

const fields: AdminField[] = [
  { name: "name", label: "Skill name", type: "text", placeholder: "React.js", required: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: [
      { value: "Development", label: "Development" },
      { value: "Infrastructure", label: "Infrastructure" },
      { value: "Automation", label: "Automation" },
      { value: "Data & Cloud", label: "Data & Cloud" },
    ],
  },
  {
    name: "iconPath",
    label: "Icon",
    type: "image",
    folder: "skills",
    placeholder: "https://… or upload (SVG/PNG)",
    hint: "Upload an icon or paste a URL. SVG stays crisp; existing /skills/*.svg still work.",
  },
  {
    name: "level",
    label: "Level %",
    type: "number",
    placeholder: "90",
    hint: "Fills the card bar. Use a whole number from 0 to 100.",
  },
  { name: "order", label: "Order", type: "number" },
];

function parse(formData: FormData) {
  const raw = String(formData.get("level") ?? "").trim();
  const numeric = Number(raw);
  const level =
    raw === "Expert" || raw === "Intermediate" || raw === "Beginner"
      ? raw
      : raw !== "" && Number.isInteger(numeric)
        ? String(Math.min(100, Math.max(0, numeric)))
        : null;
  return {
    name: String(formData.get("name")),
    iconPath: String(formData.get("iconPath")),
    category: String(formData.get("category")),
    level,
    order: Number(formData.get("order") || 0),
  };
}

export default async function SkillsEditor() {
  const rows = await db.select().from(skills).orderBy(skills.order);

  async function create(formData: FormData) {
    "use server";
    await createSkill(parse(formData));
  }
  async function update(formData: FormData) {
    "use server";
    await updateSkill(Number(formData.get("id")), parse(formData));
  }
  async function remove(formData: FormData) {
    "use server";
    await deleteSkill(Number(formData.get("id")));
  }

  return (
    <AdminCrudPage
      title="Skills"
      description="Tools and technologies, grouped by category."
      createTitle="Add skill"
      editTitle="Edit skill"
      fields={fields}
      rows={rows}
      toRow={(s) => ({
        primary: s.name,
        meta: s.category,
        badges: s.level ? <Badge>{/^\d+$/.test(s.level) ? `${s.level}%` : s.level}</Badge> : null,
      })}
      createAction={create}
      updateAction={update}
      deleteAction={remove}
      empty="No skills yet."
    />
  );
}
