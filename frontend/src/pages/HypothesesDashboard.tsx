import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  User,
  Plus,
  Target,
  Handshake,
  CheckCircle,
  Building2,
  Lightbulb,
  MessageCircle,
  Truck,
  Users,
  FileText,
  DollarSign,
} from "lucide-react";

interface Hypothesis {
  id?: string;
  category: string;
  hypothesis: string;
  risk_weight: number;
  type: "AI Suggested" | "Human Added";
}

const initialHypotheses: Hypothesis[] = [];

// BMC Block styling mapping
const getBMCBlockStyle = (category: string) => {
  const categoryMap: {
    [key: string]: {
      bgColor: string;
      iconColor: string;
      icon: React.ComponentType<{ className?: string }>;
    };
  } = {
    "Key Partners": {
      bgColor: "bg-sky-50 border-sky-200",
      iconColor: "text-sky-600",
      icon: Handshake,
    },
    "Key Activities": {
      bgColor: "bg-sky-50 border-sky-200",
      iconColor: "text-sky-600",
      icon: CheckCircle,
    },
    "Key Resources": {
      bgColor: "bg-sky-50 border-sky-200",
      iconColor: "text-sky-600",
      icon: Building2,
    },
    "Value Propositions": {
      bgColor: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      icon: Lightbulb,
    },
    "Customer Relationships": {
      bgColor: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-600",
      icon: MessageCircle,
    },
    Channels: {
      bgColor: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-600",
      icon: Truck,
    },
    "Customer Segments": {
      bgColor: "bg-amber-50 border-amber-200",
      iconColor: "text-amber-600",
      icon: Users,
    },
    "Cost Structure": {
      bgColor: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      icon: FileText,
    },
    "Revenue Streams": {
      bgColor: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      icon: DollarSign,
    },
  };

  return (
    categoryMap[category] || {
      bgColor: "bg-gray-50 border-gray-200",
      iconColor: "text-gray-600",
      icon: Target,
    }
  );
};

const HypothesesDashboard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(initialHypotheses);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isGeneratingExperiments, setIsGeneratingExperiments] = useState(false);
  const [newHypothesis, setNewHypothesis] = useState({
    category: "",
    hypothesis: "",
    risk_weight: 0,
  });

  // Load hypotheses from localStorage based on project ID
  useEffect(() => {
    if (projectId) {
      try {
        const storedHypothesesList = localStorage.getItem("hypothesesList");

        if (storedHypothesesList) {
          const hypothesesList = JSON.parse(storedHypothesesList);

          // Find the hypotheses for this project
          const hypothesesEntry = hypothesesList.find(
            (entry: any) => entry.projectId.toString() === projectId
          );
          console.log(hypothesesEntry);

          if (hypothesesEntry && hypothesesEntry.hypotheses) {
            // Ensure each hypothesis has a unique ID and proper structure
            const hypothesesWithIds = hypothesesEntry.hypotheses.map(
              (h: any, index: number) => ({
                id: h.id || `hypothesis-${projectId}-${index}-${Date.now()}`,
                category: h.category || h.bmcBlock || "Unknown",
                hypothesis: h.hypothesis || h.statement || "",
                risk_weight:
                  typeof h.risk_weight === "number"
                    ? h.risk_weight
                    : h.riskWeight || 0,
                type: h.type || "AI Suggested",
              })
            );
            console.log("Loaded hypotheses with IDs:", hypothesesWithIds);
            setHypotheses(hypothesesWithIds);
          } else {
            // Reset to empty state when no data is found
            setHypotheses([]);
          }
        } else {
          // Reset to empty state when no hypothesesList exists
          setHypotheses([]);
        }
      } catch (error) {
        console.error("Error loading hypotheses from localStorage:", error);
        // Reset to empty state on error
        setHypotheses([]);
      }
    }
  }, [projectId]);

  const totalWeight = hypotheses.reduce(
    (sum, hypothesis) => sum + hypothesis.risk_weight,
    0
  );
  const isWeightValid = totalWeight === 100;

  const updateRiskWeight = (id: string, weight: number) => {
    console.log("Updating risk weight for ID:", id, "to weight:", weight);

    setHypotheses((prevHypotheses) => {
      console.log(
        "Previous hypotheses:",
        prevHypotheses.map((h) => ({ id: h.id, risk_weight: h.risk_weight }))
      );

      // Find the hypothesis to update
      const hypothesisIndex = prevHypotheses.findIndex((h) => h.id === id);
      if (hypothesisIndex === -1) {
        console.error("Hypothesis not found with ID:", id);
        return prevHypotheses;
      }

      // Create a new array with the updated hypothesis
      const updatedHypotheses = [...prevHypotheses];
      updatedHypotheses[hypothesisIndex] = {
        ...updatedHypotheses[hypothesisIndex],
        risk_weight: Math.max(0, Math.min(100, weight)),
      };

      console.log(
        "Updated hypotheses:",
        updatedHypotheses.map((h) => ({ id: h.id, risk_weight: h.risk_weight }))
      );

      // Update localStorage asynchronously to avoid blocking
      setTimeout(() => {
        try {
          const storedHypothesesList = localStorage.getItem("hypothesesList");
          let hypothesesList: any[] = [];

          if (storedHypothesesList) {
            hypothesesList = JSON.parse(storedHypothesesList);
          }

          // Find and update the entry for this project
          const projectIndex = hypothesesList.findIndex(
            (entry) => entry.projectId.toString() === projectId
          );

          if (projectIndex !== -1) {
            hypothesesList[projectIndex].hypotheses = updatedHypotheses;
            localStorage.setItem(
              "hypothesesList",
              JSON.stringify(hypothesesList)
            );
          }
        } catch (error) {
          console.error("Error updating hypotheses in localStorage:", error);
        }
      }, 0);

      return updatedHypotheses;
    });
  };

  const addHypothesis = () => {
    if (newHypothesis.hypothesis && newHypothesis.category) {
      const hypothesis: Hypothesis = {
        id: Date.now().toString(),
        category: newHypothesis.category,
        hypothesis: newHypothesis.hypothesis,
        risk_weight: newHypothesis.risk_weight,
        type: "Human Added",
      };

      const updatedHypotheses = [...hypotheses, hypothesis];
      setHypotheses(updatedHypotheses);

      // Update localStorage
      const storedHypothesesList = localStorage.getItem("hypothesesList");
      let hypothesesList: any[] = [];

      if (storedHypothesesList) {
        try {
          hypothesesList = JSON.parse(storedHypothesesList);
        } catch {
          hypothesesList = [];
        }
      }

      // Find and update the entry for this project
      const projectIndex = hypothesesList.findIndex(
        (entry) => entry.projectId.toString() === projectId
      );

      if (projectIndex !== -1) {
        hypothesesList[projectIndex].hypotheses = updatedHypotheses;
      } else {
        hypothesesList.push({
          hypotheses: updatedHypotheses,
          projectId: parseInt(projectId!),
        });
      }

      localStorage.setItem("hypothesesList", JSON.stringify(hypothesesList));

      setNewHypothesis({ category: "", hypothesis: "", risk_weight: 0 });
      setShowAddForm(false);
    }
  };

  const handleGenerateExperiments = async () => {
    try {
      setIsGeneratingExperiments(true);

      // Check if experiments already exist for this project
      const storedExperimentsList = localStorage.getItem("experimentsList");
      if (storedExperimentsList) {
        try {
          const experimentsList = JSON.parse(storedExperimentsList);
          const existingExperiments = experimentsList.find(
            (entry: any) => entry.projectId.toString() === projectId
          );

          if (
            existingExperiments &&
            existingExperiments.experiments &&
            existingExperiments.experiments.length > 0
          ) {
            // Experiments already exist, navigate directly to experiments page
            navigate(`/project/${projectId}/experiments`);
            return;
          }
        } catch (error) {
          console.error("Error checking existing experiments:", error);
        }
      }

      // Get project data from localStorage
      const storedProjects = localStorage.getItem("projects");
      if (!storedProjects) {
        throw new Error("Project data not found");
      }

      const projects = JSON.parse(storedProjects);
      const currentProject = projects.find(
        (project: any) => project.project_id.toString() === projectId
      );

      if (!currentProject) {
        throw new Error("Project not found for this project ID");
      }

      // Prepare API request data
      const requestData = {
        hypotheses: hypotheses.map((h) => ({
          category: h.category,
          hypothesis: h.hypothesis,
          risk_weight: h.risk_weight,
          type: h.type,
        })),
        project_description: currentProject.project_description,
        sector: currentProject.sector,
        project_id: projectId,
      };

      // Call the experiments generation API
      const response = await fetch(
        "https://google-hackathon-api-161123521898.asia-south1.run.app/run_experiments_agent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Store experiments in localStorage
      let experimentsList: any[] = [];

      const currentStoredExperiments = localStorage.getItem("experimentsList");
      if (currentStoredExperiments) {
        try {
          experimentsList = JSON.parse(currentStoredExperiments);
        } catch {
          experimentsList = [];
        }
      }

      // Find and update or add the experiments for this project
      const projectIndex = experimentsList.findIndex(
        (entry) => entry.projectId.toString() === projectId
      );

      if (projectIndex !== -1) {
        experimentsList[projectIndex].experiments = result.experiments;
      } else {
        experimentsList.push({
          experiments: result.experiments,
          projectId: parseInt(projectId!),
        });
      }

      localStorage.setItem("experimentsList", JSON.stringify(experimentsList));

      // Navigate to experiments page
      setTimeout(() => {
        navigate(`/project/${projectId}/experiments`);
      }, 1000);
    } catch (error) {
      console.error("Error generating experiments:", error);
      alert("Failed to generate experiments. Please try again.");
    } finally {
      setIsGeneratingExperiments(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/project/${projectId}/bmc`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to BMC
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">Hypothesis Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  FinTech Startup Alpha
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`text-sm font-medium ${
                  isWeightValid ? "text-green-600" : "text-destructive"
                }`}
              >
                Total Weight: {totalWeight}%
              </div>
              <Button
                onClick={handleGenerateExperiments}
                disabled={!isWeightValid || isGeneratingExperiments}
              >
                {isGeneratingExperiments
                  ? "Generating..."
                  : "Design Experiments"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Card */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {hypotheses.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Hypotheses
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-business-blue">
                  {hypotheses.filter((h) => h.type === "AI Suggested").length}
                </div>
                <div className="text-sm text-muted-foreground">
                  AI Suggested
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-business-purple">
                  {hypotheses.filter((h) => h.type === "Human Added").length}
                </div>
                <div className="text-sm text-muted-foreground">Human Added</div>
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    isWeightValid ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {totalWeight}%
                </div>
                <div className="text-sm text-muted-foreground">Risk Weight</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Hypothesis Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Testable Hypotheses</h2>
          <Button
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Custom Hypothesis
          </Button>
        </div>

        {/* Add Hypothesis Form */}
        {showAddForm && (
          <Card className="shadow-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Add New Hypothesis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">BMC Block</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={newHypothesis.category}
                    onChange={(e) =>
                      setNewHypothesis((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select BMC Block</option>
                    <option value="Value Propositions">
                      Value Propositions
                    </option>
                    <option value="Customer Segments">Customer Segments</option>
                    <option value="Revenue Streams">Revenue Streams</option>
                    <option value="Key Partners">Key Partners</option>
                    <option value="Key Activities">Key Activities</option>
                    <option value="Key Resources">Key Resources</option>
                    <option value="Channels">Channels</option>
                    <option value="Customer Relationships">
                      Customer Relationships
                    </option>
                    <option value="Cost Structure">Cost Structure</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskWeight">Risk Weight (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newHypothesis.risk_weight}
                    onChange={(e) =>
                      setNewHypothesis((prev) => ({
                        ...prev,
                        risk_weight: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="statement">Hypothesis Statement</Label>
                <Textarea
                  placeholder="Enter a testable hypothesis statement..."
                  value={newHypothesis.hypothesis}
                  onChange={(e) =>
                    setNewHypothesis((prev) => ({
                      ...prev,
                      hypothesis: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addHypothesis}>Add Hypothesis</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hypotheses List */}
        <div className="space-y-4">
          {hypotheses.map((hypothesis, index) => {
            const bmcStyle = getBMCBlockStyle(hypothesis.category);
            const IconComponent = bmcStyle.icon;

            return (
              <Card
                key={`${hypothesis.id}-${index}`}
                className={`shadow-card hover:shadow-elegant transition-all duration-200 ${bmcStyle.bgColor}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      {/* BMC Block Icon */}
                      <div
                        className={`p-2 bg-white/80 rounded-lg border ${bmcStyle.bgColor
                          .replace("bg-", "border-")
                          .replace("-50", "-300")}`}
                      >
                        <IconComponent
                          className={`h-5 w-5 ${bmcStyle.iconColor}`}
                        />
                      </div>

                      {/* Type Icon */}
                      {/* {hypothesis.type === "AI Suggested" ? (
                        <div className="p-1.5 bg-business-blue/10 rounded-md">
                          <Brain className="h-4 w-4 text-business-blue" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-business-purple/10 rounded-md">
                          <User className="h-4 w-4 text-business-purple" />
                        </div>
                      )} */}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${bmcStyle.iconColor} border-current`}
                          >
                            {hypothesis.category}
                          </Badge>
                          <p className="text-sm font-medium leading-relaxed">
                            {hypothesis.hypothesis}
                          </p>
                        </div>
                        <Badge
                          variant={
                            hypothesis.type === "AI Suggested"
                              ? "default"
                              : "secondary"
                          }
                          className="ml-4"
                        >
                          {hypothesis.type === "AI Suggested"
                            ? "AI Suggested"
                            : "Human Added"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">
                            Risk Weight:
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={hypothesis.risk_weight}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 0;
                              console.log(
                                `Changing hypothesis ${hypothesis.id} from ${hypothesis.risk_weight} to ${newValue}`
                              );
                              updateRiskWeight(hypothesis.id!, newValue);
                            }}
                            onBlur={(e) => {
                              const newValue = parseInt(e.target.value) || 0;
                              updateRiskWeight(hypothesis.id!, newValue);
                            }}
                            className="w-20 h-8 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Weight Validation Warning */}
        {!isWeightValid && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-destructive" />
                <p className="text-sm">
                  Risk weights must total exactly 100%. Current total:{" "}
                  {totalWeight}%
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HypothesesDashboard;
