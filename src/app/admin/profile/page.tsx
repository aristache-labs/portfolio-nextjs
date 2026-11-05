import { db } from "@/db/client";
import { profile } from "@/db/schema";
import { updateProfile } from "../actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Panel, Field, Input, Textarea, SubmitButton } from "@/components/admin/ui";
import { AvatarField } from "@/components/admin/AvatarField";
import { HERO_DEFAULTS, IDENTITY } from "@/lib/identity";

import { ABOUT_STAT_SLOTS, aboutStatsFromForm } from "@/lib/about-stats";

export const dynamic = "force-dynamic";

export default async function ProfileEditor() {
  // Profile is a singleton — read the first row (its serial id can drift after
  // a reseed, so don't filter by a hardcoded id).
  const [row] = await db.select().from(profile).limit(1);

  async function action(formData: FormData) {
    "use server";
    // Roles feed the hero marquee. Accept comma- or newline-separated input,
    // trim, and drop blanks.
    const roles = String(formData.get("roles") ?? "")
      .split(/[\n,]/)
      .map((r) => r.trim())
      .filter(Boolean);
    // avatarUrl is deliberately absent: AvatarField owns that column and writes it on upload.
    // Zod drops the absent optional, so Drizzle leaves the column alone rather than nulling it.
    await updateProfile({
      name: String(formData.get("name")),
      email: String(formData.get("email") ?? "").trim() || null,
      bio: String(formData.get("bio")),
      stats: { ...row?.stats, ...aboutStatsFromForm(formData) },
      roles,
      // Visibility is managed on the dashboard; preserve it unchanged on save.
      sectionVisibility: row?.sectionVisibility ?? {},
      resumeUrl: (formData.get("resumeUrl") as string) || null,
      heroTagline: (formData.get("heroTagline") as string) || null,
      heroHeadline: String(formData.get("heroHeadline") ?? "").trim() || null,
      heroSummary: String(formData.get("heroSummary") ?? "").trim() || null,
      availability: String(formData.get("availability") ?? "").trim() || null,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader title="Profile" description="Your name, bio, roles, and links." />

      <Panel>
        <form action={action} className="flex flex-col gap-4">
          <AvatarField defaultValue={row?.avatarUrl ?? ""} />

          <Field label="Name">
            <Input name="name" defaultValue={row?.name} placeholder="Name" />
          </Field>
          <Field
            label="Email"
            hint="Shown on the contact Email card. Leave empty to hide the card."
          >
            <Input
              name="email"
              type="email"
              defaultValue={row?.email ?? ""}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Bio">
            <Textarea name="bio" defaultValue={row?.bio} rows={4} placeholder="Bio" />
          </Field>
          <Field
            label="Roles"
            hint="Shown in the scrolling hero marquee. One per line, or comma-separated."
          >
            <Textarea
              name="roles"
              defaultValue={(row?.roles ?? []).join("\n")}
              rows={3}
              placeholder={IDENTITY.roles.join("\n")}
            />
          </Field>
          <Field label="Resume URL" hint="Full https URL to your resume/CV.">
            <Input name="resumeUrl" defaultValue={row?.resumeUrl ?? ""} placeholder="https://…" />
          </Field>
          <Field
            label="Hero tagline"
            hint="Short phrase shown beside the glowing dot under the intro. Leave empty to hide."
          >
            <Input
              name="heroTagline"
              defaultValue={row?.heroTagline ?? ""}
              placeholder="AI-native engineering"
            />
          </Field>
          <Field
            label="Hero headline"
            hint="Line under your name. The last word is highlighted. Leave empty for the default."
          >
            <Input
              name="heroHeadline"
              defaultValue={row?.heroHeadline ?? ""}
              placeholder={HERO_DEFAULTS.headline}
              maxLength={120}
            />
          </Field>
          <Field
            label="Hero summary"
            hint="Paragraph under the headline. Leave empty for the default."
          >
            <Textarea
              name="heroSummary"
              defaultValue={row?.heroSummary ?? ""}
              rows={3}
              placeholder={HERO_DEFAULTS.summary}
              maxLength={400}
            />
          </Field>
          <Field
            label="Availability"
            hint="Badge with a live dot above the hero, e.g. Available for new projects. Leave empty to hide."
          >
            <Input
              name="availability"
              defaultValue={row?.availability ?? ""}
              placeholder="Available for new projects"
              maxLength={80}
            />
          </Field>
          <fieldset className="border-border flex flex-col gap-4 rounded-xl border p-4">
            <legend className="px-2 text-sm font-semibold">About statistics</legend>
            <p className="text-muted text-sm">
              Value and label for each card. Clear either field to hide a card.
            </p>
            {ABOUT_STAT_SLOTS.map(({ key, value, label }, index) => (
              <div key={key} className="grid gap-3 sm:grid-cols-2">
                <Field label={`Card ${index + 1} value`}>
                  <Input
                    name={key}
                    defaultValue={String(row?.stats?.[key] ?? value)}
                    maxLength={24}
                  />
                </Field>
                <Field label={`Card ${index + 1} label`}>
                  <Input
                    name={`${key}Label`}
                    defaultValue={String(row?.stats?.[`${key}Label`] ?? label)}
                    maxLength={80}
                  />
                </Field>
              </div>
            ))}
          </fieldset>
          <SubmitButton>Save changes</SubmitButton>
        </form>
      </Panel>
    </div>
  );
}
