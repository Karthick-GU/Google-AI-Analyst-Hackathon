import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ProjectIntake = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    project_name: "",
    project_description: "",
    sector: "",
    funding_stage: "",
    team_size: 0,
    project_document: "",
    cost_structure: "",
    revenue_potential: "",
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Validation function to check if all required fields are filled
  const isFormValid = () => {
    return (
      formData.project_name.trim() !== "" &&
      formData.project_description.trim() !== "" &&
      formData.sector.trim() !== "" &&
      formData.funding_stage.trim() !== "" &&
      formData.cost_structure.trim() !== "" &&
      formData.revenue_potential.trim() !== ""
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Prepare project document string (file names)
      const projectDocument = files.map((file) => file.name).join(", ");
      let projectId = Math.floor(Math.random() * 1000000);
      // helper: upload files for a project and return the uploaded filenames
      const uploadFiles = async (projId: number, filesToUpload: File[]) => {
        if (!filesToUpload || filesToUpload.length === 0) return [] as string[];
        const form = new FormData();
        form.append("project_id", String(projId));
        filesToUpload.forEach((f) => form.append("files", f));

        const resp = await fetch("https://gg-api-243440749681.europe-west1.run.app/file_upload", {
          method: "POST",
          body: form,
        });
        if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
        const data = await resp.json();
        if (data && Array.isArray(data.uploaded)) {
          return data.uploaded.map((u: string) => u.split("/").pop() || "");
        }
        return [] as string[];
      };

      // perform uploads for each category and get filenames
      const pitchDeckNames = await uploadFiles(projectId, pitchDecks);
      const callTranscriptNames = await uploadFiles(projectId, callTranscripts);
      const founderUpdateNames = await uploadFiles(projectId, founderUpdates);
      const emailNames = await uploadFiles(projectId, emails);

      const allFileNames = [
        ...pitchDeckNames,
        ...callTranscriptNames,
        ...founderUpdateNames,
        ...emailNames,
      ].filter(Boolean);

      // Create the data object
      const projectData = {
        project_name: formData.project_name,
        project_description: formData.project_description,
        sector: formData.sector,
        funding_stage: formData.funding_stage,
        team_size: formData.team_size,
        project_document: projectDocument,
        cost_structure: formData.cost_structure,
        revenue_potential: formData.revenue_potential,
        project_id: projectId,
        file_names: allFileNames.join(", "),
      };

      // Store in localStorage
      // localStorage.setItem("projectData", JSON.stringify(projectData));

      // Ensure `projects` is always an array of Project
      let projects: Project[] = [];

      const stored = localStorage.getItem("projects");

      if (stored) {
        try {
          projects = JSON.parse(stored) as Project[];
        } catch {
          projects = [];
        }
      }

      projects.push(projectData);
      localStorage.setItem("projects", JSON.stringify(projects));

      // Call the API
      const response = await fetch(
        "https://gg-api-243440749681.europe-west1.run.app/run_bmc_pipeline",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      let bmcData = result;

      let storedBMCDataList = localStorage.getItem("bmcDataList");
      let bmcDataList: any[] = [];
      if (storedBMCDataList) {
        try {
          bmcDataList = JSON.parse(storedBMCDataList);
        } catch {
          bmcDataList = [];
        }
      }
      bmcDataList.push({ bmcData, projectId });
      localStorage.setItem("bmcDataList", JSON.stringify(bmcDataList));

      // Navigate to BMC editor
      navigate(`/project/${projectData.project_id}/bmc`, {
        state: { bmcData },
      });
    } catch (error) {
      console.error("Error submitting project:", error);
      alert("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const [pitchDecks, setPitchDecks] = useState<File[]>([]);
  const [callTranscripts, setCallTranscripts] = useState<File[]>([]);
  const [founderUpdates, setFounderUpdates] = useState<File[]>([]);
  const [emails, setEmails] = useState<File[]>([]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setter((prev) => [...prev, ...newFiles]);
    }
  };

  const removeUploadedFile = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<File[]>>
  ) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">New Project Intake</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <CardDescription>
              Upload your startup deck or enter project details manually to get
              started with AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* <div className="space-y-4">
              <Label className="text-base font-medium">
                Upload Startup Deck
              </Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your files here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse (PDF, PPTX, DOCX supported)
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.pptx,.docx"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  placeholder="e.g., FinTech Startup Alpha"
                  value={formData.project_name}
                  onChange={(e) =>
                    handleInputChange("project_name", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector">Sector *</Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) => handleInputChange("sector", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fintech">FinTech</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="cleantech">CleanTech</SelectItem>
                    <SelectItem value="edtech">EdTech</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Funding Stage *</Label>
                <Select
                  value={formData.funding_stage}
                  onValueChange={(value) =>
                    handleInputChange("funding_stage", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea Stage</SelectItem>
                    <SelectItem value="pre-seed">Pre-seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series-a">Series A</SelectItem>
                    <SelectItem value="series-b">Series B</SelectItem>
                    <SelectItem value="series-c">Series C+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Team Size</Label>
                <Input
                  id="team"
                  type="number"
                  placeholder="e.g., 12"
                  value={formData.team_size || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "team_size",
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costStructure">Cost Structure *</Label>
                <Input
                  id="costStructure"
                  placeholder="e.g., $50,000"
                  value={formData.cost_structure}
                  onChange={(e) =>
                    handleInputChange("cost_structure", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenuePotential">Revenue Potential *</Label>
                <Input
                  id="revenuePotential"
                  placeholder="e.g., $100,000"
                  value={formData.revenue_potential}
                  onChange={(e) =>
                    handleInputChange("revenue_potential", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the startup, its mission, and key value propositions..."
                rows={4}
                value={formData.project_description}
                onChange={(e) =>
                  handleInputChange("project_description", e.target.value)
                }
                required
              />
            </div>

            <CardContent className="space-y-6">
              {/* ...existing code... */}

              {/* New section for document uploads */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Upload Documents (optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pitch Decks */}
                  <div>
                    <Label>Pitch Decks</Label>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.pptx,.docx"
                      onChange={(e) => handleFileUpload(e, setPitchDecks)}
                    />
                    {pitchDecks.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {pitchDecks.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadedFile(idx, setPitchDecks)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Call Transcripts */}
                  <div>
                    <Label>Call Transcripts</Label>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => handleFileUpload(e, setCallTranscripts)}
                    />
                    {callTranscripts.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {callTranscripts.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadedFile(idx, setCallTranscripts)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Founder Updates */}
                  <div>
                    <Label>Founder Updates</Label>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => handleFileUpload(e, setFounderUpdates)}
                    />
                    {founderUpdates.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {founderUpdates.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadedFile(idx, setFounderUpdates)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Emails */}
                  <div>
                    <Label>Emails</Label>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.eml"
                      onChange={(e) => handleFileUpload(e, setEmails)}
                    />
                    {emails.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {emails.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadedFile(idx, setEmails)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ...existing code... */}
            </CardContent>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/">Cancel</Link>
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={loading || !isFormValid()}
              >
                {loading
                  ? "Creating Project..."
                  : "Create Project & Generate BMC"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
interface Project {
  project_name: string;
  project_description: string;
  sector: string;
  funding_stage: string;
  team_size: number;
  project_document: string;
  cost_structure: string;
  revenue_potential: string;
}
export default ProjectIntake;
