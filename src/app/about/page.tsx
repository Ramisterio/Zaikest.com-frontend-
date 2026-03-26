"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useTheme } from "../../context/ThemeContext";
import EditableText from "../../components/theme/EditableText";

export default function AboutPage() {
  const { theme, editMode, canManageTheme, updateTheme } = useTheme();

  return (
    <>
      <Navbar />
      <main className="bg-transparent pt-[var(--nav-h)]">
        <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="rounded-3xl border border-green-200 bg-white/80 shadow-sm p-6 sm:p-10">
            <EditableText
              as="h1"
              className="text-3xl sm:text-4xl font-extrabold text-green-950"
              value={theme.content.aboutHeading}
              fallback="About Zaikest"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { aboutHeading: next } })}
            />
            <EditableText
              as="div"
              className="mt-5 text-green-900/90 text-sm sm:text-base leading-relaxed whitespace-pre-line"
              value={theme.content.aboutBody}
              fallback="Zaikest brings the true taste of Pakistan to kitchens everywhere."
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { aboutBody: next } })}
              multiline
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
