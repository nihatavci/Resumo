'use client';

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Sparkles } from "lucide-react";
import { WorkExperience, Project, Skill, Education } from "@/lib/types";
import { useState } from 'react';
import Tiptap from "@/components/ui/tiptap";

const DIFF_HIGHLIGHT_CLASSES = "bg-green-300 px-1  rounded-sm";

type SuggestionContent = WorkExperience | Project | Skill | Education;

interface SuggestionProps {
  type: 'work_experience' | 'project' | 'skill' | 'education';
  content: SuggestionContent;
  currentContent: SuggestionContent | null;
  onAccept: () => void;
  onReject: () => void;
}

interface WholeResumeSuggestionProps {
  onReject: () => void;
}

interface WorkExperienceSuggestionProps {
  content: WorkExperience;
  currentContent: WorkExperience | null;
}

function WorkExperienceSuggestion({ content: work, currentContent: currentWork }: WorkExperienceSuggestionProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className={cn(
            "text-base font-normal text-foreground",
            !currentWork || currentWork.position !== work.position && DIFF_HIGHLIGHT_CLASSES
          )}>
            {work.position.replace(/\*\*/g, '')}
          </h3>
          <p className={cn(
            "text-xs text-muted-foreground",
            !currentWork || currentWork.company !== work.company && DIFF_HIGHLIGHT_CLASSES
          )}>
            {work.company}
          </p>
        </div>
        <span className={cn(
          "text-[10px] text-dia-tertiary",
          !currentWork || currentWork.date !== work.date && DIFF_HIGHLIGHT_CLASSES
        )}>
          {work.date}
        </span>
      </div>
      <div className="space-y-1.5">
        {work.description.map((point, index) => {
          const currentPoint = currentWork?.description?.[index];
          const comparedWords = currentPoint
            ? compareDescriptions(currentPoint, point)
            : [{ text: point.replace(/\*\*/g, ''), isNew: true, isBold: false, isStart: true, isEnd: true }];

          return (
            <div key={index} className="flex items-start gap-1.5">
              <span className="text-foreground mt-0.5 text-xs">•</span>
              <p className="text-sm text-foreground flex-1 flex flex-wrap">
                {comparedWords.map((word, wordIndex) => (
                  <span
                    key={wordIndex}
                    className={cn(
                      "inline-flex items-center",
                      word.isStart && "rounded-l-sm pl-1",
                      word.isEnd && "rounded-r-sm pr-1",
                      wordIndex < comparedWords.length - 1 && "mr-1",
                      word.isNew && "bg-green-300 px-1 mx-0",
                    )}
                  >
                    {word.isBold ? (
                      <strong>{word.text}</strong>
                    ) : (
                      word.text
                    )}
                  </span>
                ))}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ProjectSuggestionProps {
  content: Project;
  currentContent: Project | null;
}

function ProjectSuggestion({ content: project, currentContent: currentProject }: ProjectSuggestionProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <h3 className={cn(
          "text-lg font-normal text-foreground",
          !currentProject || currentProject.name !== project.name && DIFF_HIGHLIGHT_CLASSES
        )}>
          {project.name}
        </h3>
        {project.date && (
          <span className={cn(
            "text-xs text-dia-tertiary",
            !currentProject || currentProject.date !== project.date && DIFF_HIGHLIGHT_CLASSES
          )}>
            {project.date}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {project.description.map((point, index) => {
          const currentPoint = currentProject?.description?.[index];
          const comparedWords = currentPoint
            ? compareDescriptions(currentPoint, point)
            : [{ text: point.replace(/\*\*/g, ''), isNew: true, isBold: false, isStart: true, isEnd: true }];

          return (
            <div key={index} className="flex items-start gap-1.5">
              <span className="text-foreground mt-0.5 text-xs">•</span>
              <p className="text-xs text-foreground flex-1 flex flex-wrap">
                {comparedWords.map((word, wordIndex) => (
                  <span
                    key={wordIndex}
                    className={cn(
                      "inline-flex items-center",
                      word.isNew && "bg-green-300",
                      word.isStart && "rounded-l-sm pl-1",
                      word.isEnd && "rounded-r-sm pr-1",
                      wordIndex < comparedWords.length - 1 && "mr-1",
                      word.isNew && "bg-green-300 px-1 mx-0",
                    )}
                  >
                    {word.isBold ? (
                      <strong>{word.text}</strong>
                    ) : (
                      word.text
                    )}
                  </span>
                ))}
              </p>
            </div>
          );
        })}
      </div>
      {project.technologies && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {project.technologies.map((tech, index) => (
            <span
              key={index}
              className={cn(
                "px-2 py-0.5 text-xs rounded-full border text-muted-foreground",
                !currentProject || isNewItem(currentProject.technologies, project.technologies, tech)
                  ? DIFF_HIGHLIGHT_CLASSES
                  : "bg-muted border-border"
              )}
            >
              {tech.replace(/\*\*/g, '')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface SkillSuggestionProps {
  content: Skill;
  currentContent: Skill | null;
}

function SkillSuggestion({ content: skill, currentContent: currentSkill }: SkillSuggestionProps) {
  return (
    <div className="space-y-3">
      {/* Category Header */}
      <div className="flex-1">
        <Tiptap
          content={skill.category}
          onChange={() => {}}
          readOnly={true}
          variant="skill"
          className={cn(
            "text-sm font-medium tracking-wide",
            "bg-transparent",
            "border-none shadow-none",
            !currentSkill || currentSkill.category !== skill.category && "bg-green-50 text-green-700 px-2 py-1 rounded-dia-btn"
          )}
        />
      </div>

      {/* Skills Grid */}
      <div className="flex flex-wrap gap-2">
        {skill.items.map((item, index) => {
          const isNew = !currentSkill || isNewItem(currentSkill.items, skill.items, item);

          return (
            <div
              key={index}
              className={cn(
                "relative group transition-all duration-300",
                "rounded-dia-btn overflow-hidden",
                isNew ? [
                  "bg-green-50",
                  "border border-green-200",
                  "shadow-dia",
                ] : [
                  "bg-dia-canvas",
                  "border border-border",
                  "shadow-dia",
                ],
                "hover:-translate-y-0.5 hover:shadow-md",
                "transition-all duration-300 ease-in-out"
              )}
            >
              {/* Skill Content */}
              <div className="relative px-3 py-1.5">
                <Tiptap
                  content={item}
                  onChange={() => {}}
                  readOnly={true}
                  variant="skill"
                  className={cn(
                    "border-none shadow-none p-0",
                    "text-sm",
                    "bg-transparent",
                    isNew ? "text-green-700" : "text-muted-foreground"
                  )}
                />
              </div>

              {/* New Indicator */}
              {isNew && (
                <div className="absolute -top-1 -right-1">
                  <div className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-20"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500/10"></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EducationSuggestionProps {
  content: Education;
  currentContent: Education | null;
}

function EducationSuggestion({ content: education, currentContent: currentEducation }: EducationSuggestionProps) {
  return (
    <div className="space-y-2 w-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className={cn(
            "font-medium text-foreground",
            !currentEducation || (currentEducation.degree !== education.degree || currentEducation.field !== education.field) && DIFF_HIGHLIGHT_CLASSES
          )}>
            <span>
              {education.degree.split(/(\*\*.*?\*\*)/).map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ?
                  <strong key={i}>{part.slice(2, -2)}</strong> :
                  part
              )}
            </span>
            {' in '}
            <span>
              {education.field.split(/(\*\*.*?\*\*)/).map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ?
                  <strong key={i}>{part.slice(2, -2)}</strong> :
                  part
              )}
            </span>
          </h3>
          <p className={cn(
            "text-sm text-muted-foreground",
            !currentEducation || currentEducation.school !== education.school && DIFF_HIGHLIGHT_CLASSES
          )}>
            {education.school.replace(/\*\*/g, '')}
          </p>
        </div>
        <span className={cn(
          "text-xs text-dia-tertiary",
          !currentEducation || currentEducation.date !== education.date && DIFF_HIGHLIGHT_CLASSES
        )}>
          {education.date.replace(/\*\*/g, '')}
        </span>
      </div>
      {education.achievements && (
        <div className="space-y-1.5">
          {education.achievements.map((achievement, index) => {
            const currentAchievement = currentEducation?.achievements?.[index];
            const comparedWords = currentAchievement
              ? compareDescriptions(currentAchievement, achievement)
              : [{ text: achievement.replace(/\*\*/g, ''), isNew: true, isBold: false, isStart: true, isEnd: true }];

            return (
              <div key={index} className="flex items-start gap-1.5">
                <span className="text-foreground mt-0.5 text-xs">•</span>
                <p className="text-xs text-foreground flex-1 flex flex-wrap">
                  {comparedWords.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      className={cn(
                        "inline-flex items-center",
                        word.isNew && "bg-green-300",
                        word.isStart && "rounded-l-sm pl-1",
                        word.isEnd && "rounded-r-sm pr-1",
                        wordIndex < comparedWords.length - 1 && "mr-1",
                        word.isNew && "bg-green-300 px-1 mx-0",
                      )}
                    >
                      {word.isBold ? (
                        <strong>{word.text}</strong>
                      ) : (
                        word.text
                      )}
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function compareDescriptions(current: string, suggested: string): {
  text: string;
  isNew: boolean;
  isBold: boolean;
  isStart: boolean;
  isEnd: boolean;
}[] {
  // Clean the text by normalizing spaces and removing extra whitespace
  const cleanText = (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  };

  // Split text into words, preserving bold markdown
  const splitText = (text: string): string[] => {
    // First, split by bold markdown
    const parts = text.split(/(\*\*[^*]+\*\*)/).filter(Boolean);

    // Then split non-bold parts by spaces while preserving bold parts
    return parts.flatMap(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return [part];
      }
      return part.split(/\s+/).filter(Boolean);
    });
  };

  const currentText = cleanText(current);
  const suggestedText = cleanText(suggested);

  const currentWords = splitText(currentText);
  const suggestedWords = splitText(suggestedText);

  return suggestedWords.map((word, index) => {
    const isBold = word.startsWith('**') && word.endsWith('**');
    const cleanedWord = isBold ? word.slice(2, -2) : word;

    // Check if the word exists in current text (considering bold status)
    const isNew = !currentWords.some(currentWord => {
      const currentIsBold = currentWord.startsWith('**') && currentWord.endsWith('**');
      const currentCleaned = currentIsBold ? currentWord.slice(2, -2) : currentWord;
      return currentCleaned === cleanedWord;
    });

    // Check if adjacent words are new
    const prevWord = index > 0 ? suggestedWords[index - 1] : null;
    const nextWord = index < suggestedWords.length - 1 ? suggestedWords[index + 1] : null;

    const prevIsNew = prevWord ? !currentWords.includes(prevWord) : false;
    const nextIsNew = nextWord ? !currentWords.includes(nextWord) : false;

    return {
      text: cleanedWord,
      isNew,
      isBold,
      isStart: isNew && !prevIsNew,
      isEnd: isNew && !nextIsNew
    };
  });
}


function isNewItem<T>(current: T[] | undefined, suggested: T[] | undefined, item: T): boolean {
  if (!current) return true;
  return !current.includes(item);
}

// const renderBoldText = (text: string) => {
//   return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
//     if (part.startsWith('**') && part.endsWith('**')) {
//       return <strong key={index}>{part.slice(2, -2)}</strong>;
//     }
//     return part;
//   });
// };

export function Suggestion({ type, content, currentContent, onAccept, onReject }: SuggestionProps) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const handleAccept = () => {
    setStatus('accepted');
    onAccept();
  };

  const handleReject = () => {
    setStatus('rejected');
    onReject();
  };

  // Helper function to get status-based styles
  const getStatusStyles = () => {
    switch (status) {
      case 'accepted':
        return {
          card: "bg-green-50 border-green-200",
          icon: "bg-green-100",
          iconColor: "text-green-600",
          label: "text-green-600",
          text: "Accepted"
        };
      case 'rejected':
        return {
          card: "bg-red-50 border-red-200",
          icon: "bg-red-100",
          iconColor: "text-red-600",
          label: "text-red-600",
          text: "Rejected"
        };
      default:
        return {
          card: "bg-white border-border",
          icon: "bg-muted",
          iconColor: "text-muted-foreground",
          label: "text-foreground",
          text: "AI Suggestion"
        };
    }
  };

  const statusStyles = getStatusStyles();

  // Helper function to render content based on type
  const renderContent = () => {
    switch (type) {
      case 'work_experience':
        return <WorkExperienceSuggestion content={content as WorkExperience} currentContent={currentContent as WorkExperience | null} />;
      case 'project':
        return <ProjectSuggestion content={content as Project} currentContent={currentContent as Project | null} />;
      case 'skill':
        return <SkillSuggestion content={content as Skill} currentContent={currentContent as Skill | null} />;
      case 'education':
        return <EducationSuggestion content={content as Education} currentContent={currentContent as Education | null} />;
    }
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden",
      "border",
      "rounded-dia-sm",
      statusStyles.card,
      "shadow-dia",
      "transition-all duration-300 ease-in-out",
      "hover:shadow-md"
    )}>
      {/* Content */}
      <div className="relative ">
        {/* Header */}
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-dia-btn shadow-dia", statusStyles.icon)}>
              <Sparkles className={cn("h-3.5 w-3.5", statusStyles.iconColor)} />
            </div>
            <span className={cn("font-medium text-sm", statusStyles.label)}>{statusStyles.text}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-dia-btn p-3 border border-border shadow-dia">
          {renderContent()}
        </div>

        {/* Action Buttons */}
        {status === 'pending' && (
          <div className="flex justify-end gap-2 pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              className={cn(
                "relative group/button overflow-hidden",
                "h-8 px-4 text-xs",
                "bg-red-50",
                "text-red-700",
                "border border-red-200",
                "shadow-dia",
                "transition-all duration-300",
                "hover:bg-red-100",
                "hover:border-red-300",
                "hover:-translate-y-0.5",
                "active:translate-y-0",
                "rounded-dia-btn"
              )}
            >
              <div className="relative flex items-center justify-center gap-1.5">
                <X className="h-3.5 w-3.5 transition-transform duration-300 group-hover/button:rotate-90" />
                <span className="font-medium">Reject</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAccept}
              className={cn(
                "relative group/button overflow-hidden",
                "h-8 px-4 text-xs",
                "bg-green-50",
                "text-green-700",
                "border border-green-200",
                "shadow-dia",
                "transition-all duration-300",
                "hover:bg-green-100",
                "hover:border-green-300",
                "hover:-translate-y-0.5",
                "active:translate-y-0",
                "rounded-dia-btn"
              )}
            >
              <div className="relative flex items-center justify-center gap-1.5">
                <Check className="h-3.5 w-3.5 transition-transform duration-300 group-hover/button:scale-110" />
                <span className="font-medium">Accept</span>
              </div>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export function WholeResumeSuggestion({ onReject }: WholeResumeSuggestionProps) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const handleAccept = () => {
    setStatus('accepted');
    // No need to do anything as changes are already applied
  };

  const handleReject = () => {
    setStatus('rejected');
    onReject();
  };

  const statusStyles = {
    pending: {
      card: "bg-white border-border",
      icon: "bg-muted",
      iconColor: "text-muted-foreground",
      label: "text-foreground",
      text: "Modified Resume"
    },
    accepted: {
      card: "bg-green-50 border-green-200",
      icon: "bg-green-100",
      iconColor: "text-green-600",
      label: "text-green-600",
      text: "Changes Accepted"
    },
    rejected: {
      card: "bg-red-50 border-red-200",
      icon: "bg-red-100",
      iconColor: "text-red-600",
      label: "text-red-600",
      text: "Changes Rejected"
    }
  }[status];

  return (
    <Card className={cn(
      "group relative overflow-hidden p-4",
      "border rounded-dia-sm",
      statusStyles.card,
      "shadow-dia",
      "transition-all duration-300 ease-in-out",
      "hover:shadow-md"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-dia-btn shadow-dia", statusStyles.icon)}>
          <Sparkles className={cn("h-3.5 w-3.5", statusStyles.iconColor)} />
        </div>
        <span className={cn("font-medium text-sm", statusStyles.label)}>
          {statusStyles.text}
        </span>
      </div>

      {status === 'pending' && (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            className={cn(
              "relative group/button overflow-hidden",
              "h-8 px-4 text-xs",
              "bg-red-50",
              "text-red-700",
              "border border-red-200",
              "shadow-dia",
              "transition-all duration-300",
              "hover:bg-red-100",
              "hover:border-red-300",
              "hover:-translate-y-0.5",
              "active:translate-y-0",
              "rounded-dia-btn"
            )}
          >
            <div className="relative flex items-center justify-center gap-1.5">
              <X className="h-3.5 w-3.5 transition-transform duration-300 group-hover/button:rotate-90" />
              <span className="font-medium">Undo Changes</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAccept}
            className={cn(
              "relative group/button overflow-hidden",
              "h-8 px-4 text-xs",
              "bg-green-50",
              "text-green-700",
              "border border-green-200",
              "shadow-dia",
              "transition-all duration-300",
              "hover:bg-green-100",
              "hover:border-green-300",
              "hover:-translate-y-0.5",
              "active:translate-y-0",
              "rounded-dia-btn"
            )}
          >
            <div className="relative flex items-center justify-center gap-1.5">
              <Check className="h-3.5 w-3.5 transition-transform duration-300 group-hover/button:scale-110" />
              <span className="font-medium">Keep Changes</span>
            </div>
          </Button>
        </div>
      )}
    </Card>
  );
}
