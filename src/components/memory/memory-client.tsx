'use client';

import { useState } from 'react';
import { Profile, WorkExperience, Education, Skill, Project } from '@/lib/types';
import { updateBasicInfo, updateWorkExperience, updateEducation, updateSkills, updateProjects } from '@/utils/actions/memory';
import { resetMyData } from '@/utils/actions/reset';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Check, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface MemoryClientProps {
  profile: Profile;
}

type SectionKey = 'basic' | 'experience' | 'education' | 'skills' | 'projects';

function SectionCard({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-dia-sm border border-dia-divider bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-dia-fog transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-base font-medium text-foreground">{title}</h2>
          {count !== undefined && (
            <span className="text-xs text-dia-muted bg-dia-fog px-2 py-0.5 rounded-full">{count}</span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-dia-muted" /> : <ChevronDown className="h-4 w-4 text-dia-muted" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border-0 border-b border-dia-divider bg-transparent pb-1.5 text-sm text-foreground placeholder:text-dia-muted focus:outline-none focus:border-foreground transition-colors"
      />
    </div>
  );
}

export function MemoryClient({ profile: initialProfile }: MemoryClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [savingSection, setSavingSection] = useState<SectionKey | null>(null);

  // Basic info
  const [basicDraft, setBasicDraft] = useState({
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    email: profile.email ?? '',
    phone_number: profile.phone_number ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    linkedin_url: profile.linkedin_url ?? '',
    github_url: profile.github_url ?? '',
  });

  async function saveBasic() {
    setSavingSection('basic');
    try {
      const updated = await updateBasicInfo(basicDraft);
      setProfile(updated);
      toast.success('Basic info saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingSection(null);
    }
  }

  // Work experience
  const [workDraft, setWorkDraft] = useState<WorkExperience[]>(profile.work_experience ?? []);

  function addWork() {
    const blank: WorkExperience = { position: '', company: '', date: '', description: [] };
    setWorkDraft(prev => [...prev, blank]);
  }

  function removeWork(idx: number) {
    setWorkDraft(prev => prev.filter((_, i) => i !== idx));
  }

  function setWorkField<K extends keyof WorkExperience>(idx: number, field: K, value: WorkExperience[K]) {
    setWorkDraft(prev => prev.map((w, i) => i === idx ? { ...w, [field]: value } : w));
  }

  async function saveWork() {
    setSavingSection('experience');
    try {
      const updated = await updateWorkExperience(workDraft);
      setProfile(updated);
      toast.success('Work experience saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingSection(null);
    }
  }

  // Education
  const [eduDraft, setEduDraft] = useState<Education[]>(profile.education ?? []);

  function addEdu() {
    const blank: Education = { degree: '', school: '', field: '', date: '' };
    setEduDraft(prev => [...prev, blank]);
  }

  function removeEdu(idx: number) {
    setEduDraft(prev => prev.filter((_, i) => i !== idx));
  }

  function setEduField<K extends keyof Education>(idx: number, field: K, value: Education[K]) {
    setEduDraft(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  async function saveEdu() {
    setSavingSection('education');
    try {
      const updated = await updateEducation(eduDraft);
      setProfile(updated);
      toast.success('Education saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingSection(null);
    }
  }

  // Skills
  const [skillsDraft, setSkillsDraft] = useState<Skill[]>(profile.skills ?? []);

  function addSkill() {
    setSkillsDraft(prev => [...prev, { category: '', items: [] }]);
  }

  function removeSkill(idx: number) {
    setSkillsDraft(prev => prev.filter((_, i) => i !== idx));
  }

  function setSkillField<K extends keyof Skill>(idx: number, field: K, value: Skill[K]) {
    setSkillsDraft(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  async function saveSkills() {
    setSavingSection('skills');
    try {
      const updated = await updateSkills(skillsDraft);
      setProfile(updated);
      toast.success('Skills saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingSection(null);
    }
  }

  // Projects
  const [projectsDraft, setProjectsDraft] = useState<Project[]>(profile.projects ?? []);

  function addProject() {
    const blank: Project = { name: '', description: [] };
    setProjectsDraft(prev => [...prev, blank]);
  }

  function removeProject(idx: number) {
    setProjectsDraft(prev => prev.filter((_, i) => i !== idx));
  }

  function setProjectField<K extends keyof Project>(idx: number, field: K, value: Project[K]) {
    setProjectsDraft(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  async function saveProjects() {
    setSavingSection('projects');
    try {
      const updated = await updateProjects(projectsDraft);
      setProfile(updated);
      toast.success('Projects saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingSection(null);
    }
  }

  const SaveBar = ({ section, onSave }: { section: SectionKey; onSave: () => void }) => (
    <div className="flex justify-end mt-4">
      <button
        onClick={onSave}
        disabled={savingSection === section}
        className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-dia-graphite disabled:opacity-50"
      >
        <Check className="h-4 w-4" />
        {savingSection === section ? 'Saving…' : 'Save'}
      </button>
    </div>
  );

  return (
    <main className="min-h-[calc(100vh-3.5rem)] max-w-[800px] mx-auto px-4 py-8 space-y-4">
      <div className="mb-6">
        <h1 className="text-dia-heading-sm font-light text-foreground">Memory</h1>
        <p className="text-sm text-dia-muted mt-1">
          Your career data. Edit anytime — changes reflect in your next tailored CV.
        </p>
      </div>

      {/* Basic Info */}
      <SectionCard title="Basic Info" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" value={basicDraft.first_name} onChange={v => setBasicDraft(p => ({ ...p, first_name: v }))} />
          <Field label="Last Name" value={basicDraft.last_name} onChange={v => setBasicDraft(p => ({ ...p, last_name: v }))} />
          <Field label="Email" value={basicDraft.email} onChange={v => setBasicDraft(p => ({ ...p, email: v }))} />
          <Field label="Phone" value={basicDraft.phone_number} onChange={v => setBasicDraft(p => ({ ...p, phone_number: v }))} />
          <Field label="Location" value={basicDraft.location} onChange={v => setBasicDraft(p => ({ ...p, location: v }))} />
          <Field label="Website" value={basicDraft.website} onChange={v => setBasicDraft(p => ({ ...p, website: v }))} />
          <Field label="LinkedIn URL" value={basicDraft.linkedin_url} onChange={v => setBasicDraft(p => ({ ...p, linkedin_url: v }))} />
          <Field label="GitHub URL" value={basicDraft.github_url} onChange={v => setBasicDraft(p => ({ ...p, github_url: v }))} />
        </div>
        <SaveBar section="basic" onSave={saveBasic} />
      </SectionCard>

      {/* Work Experience */}
      <SectionCard title="Work Experience" count={workDraft.length}>
        <div className="space-y-6">
          {workDraft.map((w, idx) => (
            <div key={idx} className="relative rounded-dia-sm border border-dia-divider p-4 space-y-3">
              <button onClick={() => removeWork(idx)} className="absolute top-3 right-3 text-dia-muted hover:text-foreground transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Position" value={w.position} onChange={v => setWorkField(idx, 'position', v)} />
                <Field label="Company" value={w.company} onChange={v => setWorkField(idx, 'company', v)} />
                <Field label="Location" value={w.location ?? ''} onChange={v => setWorkField(idx, 'location', v)} />
                <Field label="Date" value={w.date} onChange={v => setWorkField(idx, 'date', v)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">Description (one bullet per line)</label>
                <textarea
                  value={w.description.join('\n')}
                  onChange={e => setWorkField(idx, 'description', e.target.value.split('\n'))}
                  rows={4}
                  className="rounded-dia-sm border border-dia-divider bg-white p-3 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={(w.technologies ?? []).join(', ')}
                  onChange={e => setWorkField(idx, 'technologies', e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                  className="border-0 border-b border-dia-divider bg-transparent pb-1.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
          ))}
          <button onClick={addWork} className="flex items-center gap-2 text-sm text-dia-muted hover:text-foreground transition-colors">
            <Plus className="h-4 w-4" /> Add role
          </button>
        </div>
        <SaveBar section="experience" onSave={saveWork} />
      </SectionCard>

      {/* Education */}
      <SectionCard title="Education" count={eduDraft.length}>
        <div className="space-y-6">
          {eduDraft.map((e, idx) => (
            <div key={idx} className="relative rounded-dia-sm border border-dia-divider p-4 space-y-3">
              <button onClick={() => removeEdu(idx)} className="absolute top-3 right-3 text-dia-muted hover:text-foreground transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Degree" value={e.degree} onChange={v => setEduField(idx, 'degree', v)} />
                <Field label="School" value={e.school} onChange={v => setEduField(idx, 'school', v)} />
                <Field label="Field of Study" value={e.field} onChange={v => setEduField(idx, 'field', v)} />
                <Field label="Date" value={e.date} onChange={v => setEduField(idx, 'date', v)} />
                <Field label="Location" value={e.location ?? ''} onChange={v => setEduField(idx, 'location', v)} />
                <Field label="GPA" value={String(e.gpa ?? '')} onChange={v => setEduField(idx, 'gpa', v)} />
              </div>
            </div>
          ))}
          <button onClick={addEdu} className="flex items-center gap-2 text-sm text-dia-muted hover:text-foreground transition-colors">
            <Plus className="h-4 w-4" /> Add education
          </button>
        </div>
        <SaveBar section="education" onSave={saveEdu} />
      </SectionCard>

      {/* Skills */}
      <SectionCard title="Skills" count={skillsDraft.length}>
        <div className="space-y-4">
          {skillsDraft.map((s, idx) => (
            <div key={idx} className="relative rounded-dia-sm border border-dia-divider p-4 space-y-3">
              <button onClick={() => removeSkill(idx)} className="absolute top-3 right-3 text-dia-muted hover:text-foreground transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
              <Field label="Category" value={s.category} onChange={v => setSkillField(idx, 'category', v)} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">Items (comma-separated)</label>
                <input
                  type="text"
                  value={s.items.join(', ')}
                  onChange={e => setSkillField(idx, 'items', e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                  className="border-0 border-b border-dia-divider bg-transparent pb-1.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
          ))}
          <button onClick={addSkill} className="flex items-center gap-2 text-sm text-dia-muted hover:text-foreground transition-colors">
            <Plus className="h-4 w-4" /> Add skill category
          </button>
        </div>
        <SaveBar section="skills" onSave={saveSkills} />
      </SectionCard>

      {/* Projects */}
      <SectionCard title="Projects" count={projectsDraft.length}>
        <div className="space-y-6">
          {projectsDraft.map((p, idx) => (
            <div key={idx} className="relative rounded-dia-sm border border-dia-divider p-4 space-y-3">
              <button onClick={() => removeProject(idx)} className="absolute top-3 right-3 text-dia-muted hover:text-foreground transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name" value={p.name} onChange={v => setProjectField(idx, 'name', v)} />
                <Field label="Date" value={p.date ?? ''} onChange={v => setProjectField(idx, 'date', v)} />
                <Field label="URL" value={p.url ?? ''} onChange={v => setProjectField(idx, 'url', v)} />
                <Field label="GitHub URL" value={p.github_url ?? ''} onChange={v => setProjectField(idx, 'github_url', v)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">Description (one bullet per line)</label>
                <textarea
                  value={p.description.join('\n')}
                  onChange={e => setProjectField(idx, 'description', e.target.value.split('\n'))}
                  rows={3}
                  className="rounded-dia-sm border border-dia-divider bg-white p-3 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-dia-muted uppercase tracking-widest">Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={(p.technologies ?? []).join(', ')}
                  onChange={e => setProjectField(idx, 'technologies', e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                  className="border-0 border-b border-dia-divider bg-transparent pb-1.5 text-sm text-foreground focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
          ))}
          <button onClick={addProject} className="flex items-center gap-2 text-sm text-dia-muted hover:text-foreground transition-colors">
            <Plus className="h-4 w-4" /> Add project
          </button>
        </div>
        <SaveBar section="projects" onSave={saveProjects} />
      </SectionCard>

      {/* Danger zone */}
      <div className="mt-12 rounded-dia-sm border border-red-200 bg-red-50/40 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <h3 className="text-sm font-medium text-foreground">Reset all data</h3>
            <p className="text-xs text-foreground/60">
              Permanently deletes your profile and all generated CVs. You&apos;ll be sent back to onboarding to upload a fresh CV. Your Clerk account stays.
            </p>
            <form action={resetMyData}>
              <button
                type="submit"
                onClick={(e) => {
                  if (!confirm('Delete your profile and all CVs? This cannot be undone.')) {
                    e.preventDefault();
                  }
                }}
                className="mt-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-4 py-2 transition-colors"
              >
                Delete my data &amp; re-onboard
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
