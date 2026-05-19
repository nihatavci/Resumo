import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentSettings } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Check, Save, Trash2, Plus } from "lucide-react";

interface SavedStylesDialogProps {
  currentSettings: DocumentSettings;
  onApplyStyle: (settings: DocumentSettings) => void;
}

interface SavedStyle {
  name: string;
  settings: DocumentSettings;
  timestamp: number;
}

export function SavedStylesDialog({ currentSettings, onApplyStyle }: SavedStylesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedStyles, setSavedStyles] = useState<SavedStyle[]>([]);
  const [newStyleName, setNewStyleName] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Load saved styles from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("resumelm-saved-styles");
    if (saved) {
      setSavedStyles(JSON.parse(saved));
    }
  }, []);

  // Save current settings with name
  const handleSaveStyle = () => {
    if (!newStyleName.trim()) return;

    const newStyle: SavedStyle = {
      name: newStyleName,
      settings: currentSettings,
      timestamp: Date.now(),
    };

    const updatedStyles = [...savedStyles, newStyle];
    setSavedStyles(updatedStyles);
    localStorage.setItem("resumelm-saved-styles", JSON.stringify(updatedStyles));
    setNewStyleName("");
    setIsAddingNew(false);
  };

  // Delete a saved style
  const handleDeleteStyle = (timestamp: number) => {
    const updatedStyles = savedStyles.filter((style) => style.timestamp !== timestamp);
    setSavedStyles(updatedStyles);
    localStorage.setItem("resumelm-saved-styles", JSON.stringify(updatedStyles));
  };

  // Apply a saved style
  const handleApplyStyle = (settings: DocumentSettings) => {
    onApplyStyle(settings);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs bg-white hover:bg-muted
          border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground
          transition-all duration-300 hover:-translate-y-[1px] w-full
          shadow-dia hover:shadow-md rounded-dia-btn"
        >
          <Save className="w-3 h-3 mr-1" />
          Saved Styles
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white
        border-border shadow-dia pt-12 rounded-dia-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-foreground font-light">
              Saved Document Styles
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
              className="text-xs hover:bg-muted
                border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground
                transition-all duration-300 hover:-translate-y-[1px] rounded-dia-btn"
            >
              <Plus className="w-3 h-3 mr-1" />
              Save Current
            </Button>
          </div>
          <DialogDescription className="text-muted-foreground">
            Save current document settings or apply saved styles to your resume.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isAddingNew && (
            <div className="flex items-center gap-2 bg-dia-canvas
              p-4 rounded-dia-btn border border-border shadow-dia">
              <Input
                placeholder="Enter style name..."
                value={newStyleName}
                onChange={(e) => setNewStyleName(e.target.value)}
                className="flex-1 border-border focus:border-foreground/30 bg-white rounded-dia-btn"
                autoFocus
              />
              <Button
                onClick={handleSaveStyle}
                disabled={!newStyleName.trim()}
                size="sm"
                className="whitespace-nowrap bg-foreground
                  text-white hover:bg-foreground/90 transition-all
                  duration-300 hover:-translate-y-[1px] shadow-dia hover:shadow-md rounded-dia-btn"
              >
                Save Style
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingNew(false);
                  setNewStyleName("");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
          )}
          <div className={isAddingNew ? "" : "border-t border-border pt-4"}>
            <Label className="text-sm font-medium mb-2 block text-muted-foreground">Saved Styles</Label>
            <ScrollArea className="h-[300px] rounded-dia-sm border border-border bg-dia-canvas">
              <div className="p-4 space-y-3">
                {savedStyles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Save className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No saved styles yet</p>
                  </div>
                ) : (
                  savedStyles.map((style) => (
                    <div
                      key={style.timestamp}
                      className="flex items-center justify-between group rounded-dia-btn border
                        border-border p-3 hover:bg-muted
                        transition-all duration-300 hover:-translate-y-[1px]
                        hover:shadow-dia"
                    >
                      <span className="text-sm font-medium text-foreground">{style.name}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApplyStyle(style.settings)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300
                            text-muted-foreground hover:text-foreground hover:bg-dia-canvas"
                          title="Apply Style"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStyle(style.timestamp)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-300
                            text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete Style"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-border hover:border-foreground/30 text-muted-foreground
              hover:text-foreground hover:bg-muted
              transition-all duration-300 hover:-translate-y-[1px] rounded-dia-btn"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
