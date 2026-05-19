'use client';

import { User, Briefcase, FolderGit2, GraduationCap, Wrench, LayoutTemplate } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ResumeEditorTabs() {
  return (
    <>
      {/* Enhanced second row with Resume Score and Cover Letter */}
      <div className="my-2">
        <TabsList className="h-full w-full relative bg-white border border-border rounded-dia-sm overflow-hidden grid grid-cols-2 gap-0.5 p-0.5 shadow-dia">

          {/* Resume Score */}
          <TabsTrigger
            value="resume-score"
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-dia-btn font-medium relative transition-all duration-300
              data-[state=active]:bg-muted
              data-[state=active]:border-border data-[state=active]:shadow-dia hover:bg-dia-canvas
              data-[state=inactive]:text-dia-tertiary data-[state=inactive]:hover:text-foreground"
          >
            <div className="p-1 rounded-dia-btn bg-muted transition-transform duration-300 group-data-[state=active]:scale-105 group-data-[state=active]:bg-dia-button">
              <svg className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[state=inactive]:text-dia-tertiary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <span className="relative text-sm whitespace-nowrap">
              Resume Score
              <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-foreground scale-x-0 transition-transform duration-300 group-data-[state=active]:scale-x-100"></div>
            </span>
          </TabsTrigger>

          {/* Cover Letter */}
          <TabsTrigger
            value="cover-letter"
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-dia-btn font-medium relative transition-all duration-300
              data-[state=active]:bg-muted
              data-[state=active]:border-border data-[state=active]:shadow-dia hover:bg-dia-canvas
              data-[state=inactive]:text-dia-tertiary data-[state=inactive]:hover:text-foreground"
          >
            <div className="p-1 rounded-dia-btn bg-muted transition-transform duration-300 group-data-[state=active]:scale-105 group-data-[state=active]:bg-dia-button">
              <svg className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[state=inactive]:text-dia-tertiary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
            </div>
            <span className="relative text-sm whitespace-nowrap">
              Cover Letter
              <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-foreground scale-x-0 transition-transform duration-300 group-data-[state=active]:scale-x-100"></div>
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsList className="h-full w-full relative bg-white border border-border rounded-dia-sm overflow-hidden grid grid-cols-3 @[500px]:grid-cols-6 gap-0.5 p-0.5 shadow-dia">
        {/* Basic Info Tab */}
        <TabsTrigger
          value="basic"
          className="group flex items-center gap-1.5 px-2 py-1 rounded-dia-btn font-medium relative transition-all duration-300
            data-[state=active]:bg-muted
            data-[state=active]:border-border data-[state=active]:shadow-dia hover:bg-dia-canvas
            data-[state=inactive]:text-dia-tertiary data-[state=inactive]:hover:text-foreground"
        >
          <div className="p-1 rounded-dia-btn bg-muted transition-transform duration-300 group-data-[state=active]:scale-105 group-data-[state=active]:bg-dia-button">
            <User className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[state=inactive]:text-dia-tertiary" />
          </div>
          <span className="relative text-xs whitespace-nowrap">
            Basic Info
            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-foreground scale-x-0 transition-transform duration-300 group-data-[state=active]:scale-x-100"></div>
          </span>
        </TabsTrigger>

        {/* Work Tab */}
        <TabsTrigger
          value="work"
          className="group flex items-center gap-1.5 px-2 py-1 rounded-dia-btn font-medium relative transition-all duration-300
            data-[state=active]:bg-muted
            data-[state=active]:border-border data-[state=active]:shadow-dia hover:bg-dia-canvas
            data-[state=inactive]:text-dia-tertiary data-[state=inactive]:hover:text-foreground"
        >
          <div className="p-1 rounded-dia-btn bg-muted transition-transform duration-300 group-data-[state=active]:scale-105 group-data-[state=active]:bg-dia-button">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[state=inactive]:text-dia-tertiary" />
          </div>
          <span className="relative text-xs whitespace-nowrap">
            Work
            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-foreground scale-x-0 transition-transform duration-300 group-data-[state=active]:scale-x-100"></div>
          </span>
        </TabsTrigger>

        {/* Projects Tab */}
        <TabsTrigger
          value="projects"
          className="group flex items-center gap-1.5 px-2 py-1 rounded-dia-btn font-medium relative transition-all duration-300
            data-[state=active]:bg-muted
            data-[state=active]:border-border data-[state=active]:shadow-dia hover:bg-dia-canvas
            data-[state=inactive]:text-dia-tertiary data-[state=inactive]:hover:text-foreground"
        >
          <div className="p-1 rounded-dia-btn bg-muted transition-transform duration-300 group-data-[state=active]:scale-105 group-data-[state=active]:bg-dia-button">
            <FolderGit2 className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[state=inactive]:text-dia-tertiary" />
          </div>
          <span className="relative text-xs whitespace-nowrap">
            Projects
            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-foreground scale-x-0 transition-transform duration-300 group-data-[state=active]:scale-x-100"></div>
          </span>
        </TabsTrigger>

        {/* Education Tab */}
        <TabsTrigger
          value="education"
          className="group flex items-center gap-1.5 px-2 py-1 rounded-dia-btn font-medium relative transition-all duration-300
            data-[state=active]:bg-muted
            data-[state=active]:border-border data-[state=active]:shadow-dia hover:bg-dia-canvas
            data-[state=inactive]:text-dia-tertiary data-[state=inactive]:hover:text-foreground"
        >
          <div className="p-1 rounded-dia-btn bg-muted transition-transform duration-300 group-data-[state=active]:scale-105 group-data-[state=active]:bg-dia-button">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[state=inactive]:text-dia-tertiary" />
          </div>
          <span className="relative text-xs whitespace-nowrap">
            Education
            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-foreground scale-x-0 transition-transform duration-300 group-data-[state=active]:scale-x-100"></div>
          </span>
        </TabsTrigger>

        {/* Skills Tab */}
        <TabsTrigger
          value="skills"
          className="group flex items-center gap-1.5 px-2 py-1 rounded-dia-btn font-medium relative transition-all duration-300
            data-[state=active]:bg-muted
            data-[state=active]:border-border data-[state=active]:shadow-dia hover:bg-dia-canvas
            data-[state=inactive]:text-dia-tertiary data-[state=inactive]:hover:text-foreground"
        >
          <div className="p-1 rounded-dia-btn bg-muted transition-transform duration-300 group-data-[state=active]:scale-105 group-data-[state=active]:bg-dia-button">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[state=inactive]:text-dia-tertiary" />
          </div>
          <span className="relative text-xs whitespace-nowrap">
            Skills
            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-foreground scale-x-0 transition-transform duration-300 group-data-[state=active]:scale-x-100"></div>
          </span>
        </TabsTrigger>

        {/* Settings Tab */}
        <TabsTrigger
          value="settings"
          className="group flex items-center gap-1.5 px-2 py-1 rounded-dia-btn font-medium relative transition-all duration-300
            data-[state=active]:bg-muted
            data-[state=active]:border-border data-[state=active]:shadow-dia hover:bg-dia-canvas
            data-[state=inactive]:text-dia-tertiary data-[state=inactive]:hover:text-foreground"
        >
          <div className="p-1 rounded-dia-btn bg-muted transition-transform duration-300 group-data-[state=active]:scale-105 group-data-[state=active]:bg-dia-button">
            <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground transition-colors group-data-[state=inactive]:text-dia-tertiary" />
          </div>
          <span className="relative text-xs whitespace-nowrap">
            Layout
            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-foreground scale-x-0 transition-transform duration-300 group-data-[state=active]:scale-x-100"></div>
          </span>
        </TabsTrigger>
      </TabsList>


    </>
  );
}
