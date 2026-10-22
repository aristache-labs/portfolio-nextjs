import { db } from "@/db/client";
import { services } from "@/db/schema";
import { createService, updateService, deleteService } from "../actions";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";
import { Badge } from "@/components/admin/ui";
import { type AdminField } from "@/components/admin/RecordFormDialog";

export const dynamic = "force-dynamic";

const fields: AdminField[] = [
  { name: "title", label: "Title", type: "text", placeholder: "Web Development", required: true },
  {
    name: "shortDescription",
    label: "Homepage summary",
    type: "text",
    placeholder: "One short sentence about the result you deliver",
    hint: "Shown below the title on the compact card. Keep it to one short sentence.",
  },
  {
    name: "description",
    label: "Fallback description",
    type: "textarea",
    rows: 3,
    placeholder: "Detailed description",
    required: true,
    hint: "Used on the homepage only when the summary is empty.",
  },
  {
    name: "icon",
    label: "Icon",
    type: "text",
    placeholder: "/icons/html.svg or AppWindow",
    hint: "Use an asset path such as /icons/html.svg, or a Lucide name such as AppWindow. Leave empty to choose from the title.",
  },
  {
    name: "order",
    label: "Order",
    type: "number",
    hint: "The first three services by order appear on the homepage.",
  },
];

function parse(formData: FormData) {
  return {
    title: String(formData.get("title")),
    description: String(formData.get("description")),
    shortDescription: (formData.get("shortDescription") as string) || null,
    icon: (formData.get("icon") as string) || null,
    order: Number(formData.get("order") || 0),
  };
}

export default async function ServicesEditor() {
  const rows = await db.select().from(services).orderBy(services.order, services.id);
  const homepageIds = new Set(rows.slice(0, 3).map((service) => service.id));

  async function create(formData: FormData) {
    "use server";
    await createService(parse(formData));
  }
  async function update(formData: FormData) {
    "use server";
    await updateService(Number(formData.get("id")), parse(formData));
  }
  async function remove(formData: FormData) {
    "use server";
    await deleteService(Number(formData.get("id")));
  }

  return (
    <AdminCrudPage
      title="Services"
      description="Three compact cards on the homepage. Lower order values appear first; the remaining services stay in admin."
      createTitle="Add service"
      editTitle="Edit service"
      fields={fields}
      rows={rows}
      toRow={(s) => ({
        primary: s.title,
        meta: s.shortDescription?.trim() || s.description,
        badges: (
          <>
            <Badge tone={homepageIds.has(s.id) ? "success" : "muted"}>
              {homepageIds.has(s.id) ? "Homepage" : "Not shown"}
            </Badge>
            <Badge>Order: {s.order}</Badge>
          </>
        ),
      })}
      createAction={create}
      updateAction={update}
      deleteAction={remove}
      empty="No services yet."
    />
  );
}
