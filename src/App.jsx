import React, { useState, useMemo, useCallback } from "react";
import {
  Search, Plus, Edit2, Trash2, GraduationCap, Mail, Calendar,
  MapPin, BookOpen, ChevronLeft, CheckCircle2, AlertCircle, User,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Brand palette (applied via inline style since arbitrary hex classes don't
// render in this environment — there's no build step to generate them)
// ---------------------------------------------------------------------------
const BRAND = {
  green: "#1B4332",
  greenDark: "#123024",
  gold: "#C9A227",
};

const UNIVERSITY = "Delta State University, Abraka";
const UNIVERSITY_LOCATION = "Abraka, Delta State, Nigeria";

const seedStudents = [
  {
    id: "1",
    name: "Daniel Oghenero Efe",
    email: "daniel.efe@delsu.edu.ng",
    age: 21,
    department: "Computer Science",
    faculty: "Computing",
    level: "300",
    status: "Active",
    stateOfOrigin: "Delta State",
    enrollmentDate: "2023-10-02",
    graduationDate: "2027-07-15",
    interests:
      "Software development, artificial intelligence, web programming, and cybersecurity. Daniel is an active participant in departmental coding workshops and enjoys building web applications using Python and JavaScript.",
  },
  {
    id: "2",
    name: "Blessing Omoteye Akpoveta",
    email: "blessing.akpoveta@delsu.edu.ng",
    age: 19,
    department: "Computer Science",
    faculty: "Computing",
    level: "200",
    status: "Active",
    stateOfOrigin: "Edo State",
    enrollmentDate: "2024-10-07",
    graduationDate: "2028-07-14",
    interests:
      "UI/UX design, mobile app development, database systems, and graphics design. Blessing serves as a class representative and regularly participates in hackathons and technology seminars.",
  },
  {
    id: "3",
    name: "Samuel Ejiro Okoro",
    email: "samuel.okoro@delsu.edu.ng",
    age: 23,
    department: "Computer Science",
    faculty: "Computing",
    level: "400",
    status: "Active",
    stateOfOrigin: "Bayelsa State",
    enrollmentDate: "2022-09-26",
    graduationDate: "2026-07-10",
    interests:
      "Cloud computing, networking, machine learning, and embedded systems. Samuel is currently working on his final-year project involving an AI-based attendance management system and mentors junior students in programming.",
  },
];

const LEVELS = ["100", "200", "300", "400", "500"];
const STATUSES = ["Active", "On Leave", "Suspended", "Graduated", "Withdrawn"];

const emptyForm = {
  name: "",
  email: "",
  age: "",
  department: "",
  faculty: "",
  level: "100",
  status: "Active",
  stateOfOrigin: "",
  enrollmentDate: "",
  graduationDate: "",
  interests: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function statusTone(status) {
  switch (status) {
    case "Active":
      return { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    case "On Leave":
      return { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
    case "Graduated":
      return { dot: "bg-yellow-600", text: "text-yellow-800", bg: "bg-yellow-50" };
    case "Suspended":
    case "Withdrawn":
      return { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" };
    default:
      return { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50" };
  }
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Full name is required.";
  else if (form.name.trim().length < 3) errors.name = "Name looks too short.";

  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address.";

  if (!form.age) errors.age = "Age is required.";
  else if (Number(form.age) < 15 || Number(form.age) > 65)
    errors.age = "Enter an age between 15 and 65.";

  if (!form.department.trim()) errors.department = "Department is required.";
  if (!form.faculty.trim()) errors.faculty = "Faculty is required.";
  if (!form.stateOfOrigin.trim()) errors.stateOfOrigin = "State of origin is required.";

  if (!form.enrollmentDate) errors.enrollmentDate = "Enrollment date is required.";
  if (!form.graduationDate) errors.graduationDate = "Expected graduation date is required.";
  if (
    form.enrollmentDate &&
    form.graduationDate &&
    new Date(form.graduationDate) <= new Date(form.enrollmentDate)
  ) {
    errors.graduationDate = "Graduation date must be after enrollment.";
  }

  if (!form.interests.trim()) errors.interests = "Add at least a short interests note.";

  return errors;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm toast-pop">
      <div
        className="flex items-center gap-2.5 rounded-xl px-4 py-3 shadow-lg border text-white"
        style={{
          backgroundColor: isError ? "#e11d48" : BRAND.green,
          borderColor: isError ? "#be123c" : BRAND.greenDark,
        }}
      >
        {isError ? <AlertCircle size={18} className="shrink-0" /> : <CheckCircle2 size={18} className="shrink-0" />}
        <p className="text-sm font-medium leading-snug">{toast.message}</p>
      </div>
      <style>{`
        .toast-pop { animation: fadeSlide 0.25s ease-out; }
        @keyframes fadeSlide { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function StudentProfilesApp() {
  const [students, setStudents] = useState(seedStudents);
  const [view, setView] = useState({ mode: "list" }); // list | detail | form
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2600);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.stateOfOrigin.toLowerCase().includes(q) ||
        s.interests.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q);
      const matchesLevel = levelFilter === "All" || s.level === levelFilter;
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      return matchesQuery && matchesLevel && matchesStatus;
    });
  }, [students, query, levelFilter, statusFilter]);

  function openAddForm() {
    setForm({ ...emptyForm, department: "Computer Science", faculty: "Computing" });
    setErrors({});
    setView({ mode: "form", editingId: null });
  }

  function openEditForm(student) {
    setForm({ ...student, age: String(student.age) });
    setErrors({});
    setView({ mode: "form", editingId: student.id });
  }

  function openDetail(student) {
    setView({ mode: "detail", id: student.id });
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleSubmit() {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }
    if (view.editingId) {
      setStudents((list) =>
        list.map((s) => (s.id === view.editingId ? { ...form, id: s.id, age: Number(form.age) } : s))
      );
      showToast("Profile updated.");
      setView({ mode: "detail", id: view.editingId });
    } else {
      const newStudent = { ...form, id: Date.now().toString(), age: Number(form.age) };
      setStudents((list) => [newStudent, ...list]);
      showToast("Student profile added.");
      setView({ mode: "list" });
    }
  }

  function handleDelete(id) {
    const student = students.find((s) => s.id === id);
    setStudents((list) => list.filter((s) => s.id !== id));
    setConfirmDeleteId(null);
    setView({ mode: "list" });
    showToast(`${student?.name ?? "Profile"} deleted.`);
  }

  const activeStudent = view.mode === "detail" ? students.find((s) => s.id === view.id) : null;

  return (
    <div className="min-h-screen flex justify-center" style={{ backgroundColor: "#F4F5F1" }}>
      <div className="w-full max-w-md min-h-screen relative pb-8" style={{ backgroundColor: "#F4F5F1" }}>
        <Toast toast={toast} />

        {/* ---------------- LIST VIEW ---------------- */}
        {view.mode === "list" && (
          <>
            <header
              className="sticky top-0 z-10 text-white px-5 pt-6 pb-5 rounded-b-3xl shadow-md"
              style={{ backgroundColor: BRAND.green }}
            >
              <div
                className="flex items-center gap-2 text-xs font-semibold uppercase mb-1"
                style={{ color: BRAND.gold, letterSpacing: "0.18em" }}
              >
                <GraduationCap size={14} />
                <span>{UNIVERSITY}</span>
              </div>
              <h1 className="text-2xl font-serif font-bold leading-tight">Student Records</h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{UNIVERSITY_LOCATION}</p>

              <div className="mt-4 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.5)" }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email, state, interest…"
                  className="w-full text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none border transition-colors"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "white",
                  }}
                />
              </div>

              <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="text-white text-xs rounded-lg px-2.5 py-1.5 border outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }}
                >
                  <option className="text-black" value="All">All levels</option>
                  {LEVELS.map((l) => (
                    <option className="text-black" key={l} value={l}>{l} Level</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-white text-xs rounded-lg px-2.5 py-1.5 border outline-none"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }}
                >
                  <option className="text-black" value="All">All statuses</option>
                  {STATUSES.map((s) => (
                    <option className="text-black" key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </header>

            <main className="px-4 pt-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {filtered.length} {filtered.length === 1 ? "record" : "records"}
                </p>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <User size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-800 font-medium text-sm">No students match your search</p>
                  <p className="text-gray-500 text-xs mt-1">Try a different name, state, or filter combination.</p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {filtered.map((s) => {
                    const tone = statusTone(s.status);
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => openDetail(s)}
                          className="w-full text-left bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-200 active:scale-[0.98] transition-transform flex items-center gap-3"
                        >
                          <div
                            className="w-11 h-11 rounded-full font-serif font-bold flex items-center justify-center text-sm shrink-0"
                            style={{ backgroundColor: BRAND.green, color: BRAND.gold }}
                          >
                            {initials(s.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm truncate">{s.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {s.department} · {s.level} Level
                            </p>
                          </div>
                          <span className={`shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ${tone.bg} ${tone.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                            {s.status}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </main>

            <button
              onClick={openAddForm}
              className="fixed bottom-6 rounded-full w-14 h-14 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              style={{ backgroundColor: BRAND.gold, color: BRAND.green, right: "max(1.25rem, calc(50% - 12rem))" }}
              aria-label="Add student"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          </>
        )}

        {/* ---------------- DETAIL VIEW ---------------- */}
        {view.mode === "detail" && activeStudent && (
          <>
            <header
              className="text-white px-5 pt-6 pb-8 rounded-b-3xl shadow-md relative"
              style={{ backgroundColor: BRAND.green }}
            >
              <button
                onClick={() => setView({ mode: "list" })}
                className="flex items-center gap-1 text-sm mb-4 active:opacity-60"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                <ChevronLeft size={18} /> Back
              </button>
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-20 h-20 rounded-full font-serif font-bold flex items-center justify-center text-2xl mb-3"
                  style={{ backgroundColor: BRAND.gold, color: BRAND.green, boxShadow: "0 0 0 4px rgba(255,255,255,0.15)" }}
                >
                  {initials(activeStudent.name)}
                </div>
                <h2 className="text-xl font-serif font-bold">{activeStudent.name}</h2>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {activeStudent.department} · {activeStudent.faculty}
                </p>
                {(() => {
                  const tone = statusTone(activeStudent.status);
                  return (
                    <span className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ${tone.bg} ${tone.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                      {activeStudent.status} · {activeStudent.level} Level
                    </span>
                  );
                })()}
              </div>
            </header>

            <main className="px-5 -mt-4 relative z-10">
              <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3.5">
                <InfoRow icon={<Mail size={15} />} label="Email" value={activeStudent.email} />
                <InfoRow icon={<User size={15} />} label="Age" value={`${activeStudent.age} years`} />
                <InfoRow icon={<MapPin size={15} />} label="State of Origin" value={activeStudent.stateOfOrigin} />
                <InfoRow icon={<GraduationCap size={15} />} label="University" value={`${UNIVERSITY}, ${UNIVERSITY_LOCATION}`} />
                <InfoRow icon={<Calendar size={15} />} label="Enrolled" value={formatDate(activeStudent.enrollmentDate)} />
                <InfoRow icon={<Calendar size={15} />} label="Expected Graduation" value={formatDate(activeStudent.graduationDate)} />
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mt-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: BRAND.green }}>
                  <BookOpen size={14} /> Interests
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{activeStudent.interests}</p>
              </section>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => openEditForm(activeStudent)}
                  className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-medium py-3 rounded-xl active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: BRAND.green }}
                >
                  <Edit2 size={15} /> Edit
                </button>
                <button
                  onClick={() => setConfirmDeleteId(activeStudent.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 text-sm font-medium py-3 rounded-xl active:scale-[0.98] transition-transform"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </main>

            {confirmDeleteId && (
              <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
                <div className="w-full max-w-md bg-white rounded-t-3xl p-5 pb-7">
                  <p className="font-semibold text-gray-900 text-base mb-1">Delete this profile?</p>
                  <p className="text-sm text-gray-500 mb-5">
                    This will permanently remove {activeStudent.name}'s record. This can't be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(confirmDeleteId)}
                      className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ---------------- FORM VIEW ---------------- */}
        {view.mode === "form" && (
          <>
            <header
              className="sticky top-0 z-10 text-white px-5 pt-6 pb-4 rounded-b-3xl shadow-md flex items-center gap-3"
              style={{ backgroundColor: BRAND.green }}
            >
              <button
                onClick={() => setView(view.editingId ? { mode: "detail", id: view.editingId } : { mode: "list" })}
                className="active:opacity-60"
                aria-label="Cancel"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-serif font-bold">
                {view.editingId ? "Edit Profile" : "New Student Profile"}
              </h2>
            </header>

            <main className="px-5 pt-4 space-y-4">
              <Field label="Full Name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Daniel Oghenero Efe"
                  className={inputClass(errors.name)}
                  style={inputStyle(errors.name)}
                />
              </Field>

              <Field label="Email" error={errors.email}>
                <input
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="student@delsu.edu.ng"
                  className={inputClass(errors.email)}
                  style={inputStyle(errors.email)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Age" error={errors.age}>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    placeholder="20"
                    className={inputClass(errors.age)}
                    style={inputStyle(errors.age)}
                  />
                </Field>
                <Field label="Level" error={errors.level}>
                  <select
                    value={form.level}
                    onChange={(e) => handleChange("level", e.target.value)}
                    className={inputClass(errors.level)}
                    style={inputStyle(errors.level)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>{l} Level</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Department" error={errors.department}>
                <input
                  value={form.department}
                  onChange={(e) => handleChange("department", e.target.value)}
                  placeholder="e.g. Computer Science"
                  className={inputClass(errors.department)}
                  style={inputStyle(errors.department)}
                />
              </Field>

              <Field label="Faculty" error={errors.faculty}>
                <input
                  value={form.faculty}
                  onChange={(e) => handleChange("faculty", e.target.value)}
                  placeholder="e.g. Computing"
                  className={inputClass(errors.faculty)}
                  style={inputStyle(errors.faculty)}
                />
              </Field>

              <Field label="Status" error={errors.status}>
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className={inputClass(errors.status)}
                  style={inputStyle(errors.status)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>

              <Field label="State of Origin" error={errors.stateOfOrigin}>
                <input
                  value={form.stateOfOrigin}
                  onChange={(e) => handleChange("stateOfOrigin", e.target.value)}
                  placeholder="e.g. Delta State"
                  className={inputClass(errors.stateOfOrigin)}
                  style={inputStyle(errors.stateOfOrigin)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Enrollment Date" error={errors.enrollmentDate}>
                  <input
                    type="date"
                    value={form.enrollmentDate}
                    onChange={(e) => handleChange("enrollmentDate", e.target.value)}
                    className={inputClass(errors.enrollmentDate)}
                    style={inputStyle(errors.enrollmentDate)}
                  />
                </Field>
                <Field label="Exp. Graduation" error={errors.graduationDate}>
                  <input
                    type="date"
                    value={form.graduationDate}
                    onChange={(e) => handleChange("graduationDate", e.target.value)}
                    className={inputClass(errors.graduationDate)}
                    style={inputStyle(errors.graduationDate)}
                  />
                </Field>
              </div>

              <Field label="Interests" error={errors.interests}>
                <textarea
                  value={form.interests}
                  onChange={(e) => handleChange("interests", e.target.value)}
                  placeholder="Academic interests, activities, projects…"
                  rows={4}
                  className={inputClass(errors.interests) + " resize-none"}
                  style={inputStyle(errors.interests)}
                />
              </Field>

              <p className="text-[11px] text-gray-400 pb-2">
                {UNIVERSITY}, {UNIVERSITY_LOCATION} — recorded automatically for every profile.
              </p>

              <button
                onClick={handleSubmit}
                className="w-full text-white font-medium text-sm py-3.5 rounded-xl mb-8 active:scale-[0.98] transition-transform shadow-sm"
                style={{ backgroundColor: BRAND.green }}
              >
                {view.editingId ? "Save Changes" : "Add Student"}
              </button>
            </main>
          </>
        )}

        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0" style={{ color: BRAND.gold }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-900 font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
}

function inputClass(error) {
  return `w-full bg-white text-sm text-gray-900 rounded-xl px-3.5 py-2.5 border outline-none transition-colors ${
    error ? "border-rose-400" : "border-gray-300"
  }`;
}

function inputStyle(error) {
  return error ? {} : { borderColor: "#d1d5db" };
}
