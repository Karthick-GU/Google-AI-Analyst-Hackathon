import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  DollarSign,
  Clock,
  Target,
  FlaskConical,
  Handshake,
  CheckCircle,
  Building2,
  MessageCircle,
  Truck,
  Users,
  FileText,
} from "lucide-react";

interface ExperimentSuggestion {
  hypothesis: string;
  experiment_type: "Discovery" | "Validation";
  ai_confidence: number;
  experiment_name: string;
  testing_statement: string;
  description: string;
  cost_range: string;
  runtime: string;
  success_metric: string;
  priority: string;
  measurement: string;
  ai_doable?: boolean;
}

// BMC Block styling mapping for experiments
const getBMCBlockStyle = (hypothesis: string) => {
  // Extract category from hypothesis or use a mapping based on hypothesis content
  const getCategory = (hyp: string) => {
    const lowerHyp = hyp.toLowerCase();
    if (
      lowerHyp.includes("partner") ||
      lowerHyp.includes("alliance") ||
      lowerHyp.includes("supplier")
    )
      return "Key Partners";
    if (
      lowerHyp.includes("activity") ||
      lowerHyp.includes("process") ||
      lowerHyp.includes("operation")
    )
      return "Key Activities";
    if (
      lowerHyp.includes("resource") ||
      lowerHyp.includes("asset") ||
      lowerHyp.includes("infrastructure")
    )
      return "Key Resources";
    if (
      lowerHyp.includes("value") ||
      lowerHyp.includes("proposition") ||
      lowerHyp.includes("benefit")
    )
      return "Value Propositions";
    if (
      lowerHyp.includes("relationship") ||
      lowerHyp.includes("support") ||
      lowerHyp.includes("service")
    )
      return "Customer Relationships";
    if (
      lowerHyp.includes("channel") ||
      lowerHyp.includes("distribution") ||
      lowerHyp.includes("delivery")
    )
      return "Channels";
    if (
      lowerHyp.includes("customer") ||
      lowerHyp.includes("segment") ||
      lowerHyp.includes("user") ||
      lowerHyp.includes("market")
    )
      return "Customer Segments";
    if (
      lowerHyp.includes("cost") ||
      lowerHyp.includes("expense") ||
      lowerHyp.includes("budget")
    )
      return "Cost Structure";
    if (
      lowerHyp.includes("revenue") ||
      lowerHyp.includes("income") ||
      lowerHyp.includes("monetiz") ||
      lowerHyp.includes("pricing")
    )
      return "Revenue Streams";
    return "Value Propositions"; // Default
  };

  const category = getCategory(hypothesis);

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

  return {
    ...(categoryMap[category] || {
      bgColor: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      icon: Lightbulb,
    }),
    category,
  };
};

const ExperimentSuggestion = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [experiments, setExperiments] = useState<ExperimentSuggestion[]>([]);
  const [hasExistingExperiments, setHasExistingExperiments] =
    useState<boolean>(false);
  const [aiDoableMap, setAiDoableMap] = useState<{ [key: number]: boolean }>(
    {}
  );

  useEffect(() => {
    // Initialize ai_doable values (default True if missing)
    if (experiments.length > 0) {
      const map: { [key: number]: boolean } = {};
      experiments.forEach((exp, idx) => {
        map[idx] = typeof exp.ai_doable === "boolean" ? exp.ai_doable : true;
      });
      setAiDoableMap(map);
    }
  }, [experiments]);
  const handleAiDoableChange = (index: number, value: boolean) => {
    setAiDoableMap((prev) => ({
      ...prev,
      [index]: value,
    }));
    // Optionally, update experiments array or persist changes if needed
  };

  // Load experiments from localStorage based on project ID
  useEffect(() => {
    if (projectId) {
      try {
        const storedExperimentsList = localStorage.getItem("experimentsList");
        if (storedExperimentsList) {
          const experimentsList = JSON.parse(storedExperimentsList);
          const experimentsEntry = experimentsList.find(
            (entry: any) => entry.projectId.toString() === projectId
          );

          if (experimentsEntry && experimentsEntry.experiments) {
            setExperiments(experimentsEntry.experiments);
            setHasExistingExperiments(true);
          } else {
            setExperiments([]);
            setHasExistingExperiments(false);
          }
        } else {
          setExperiments([]);
          setHasExistingExperiments(false);
        }
      } catch (error) {
        console.error("Error loading experiments from localStorage:", error);
        setExperiments([]);
        setHasExistingExperiments(false);
      }
    }
  }, [projectId]);

  const handleExperimentClick = (experimentIndex: number) => {
    // Navigate directly to test cards with the experiment identifier
    const experiment = experiments[experimentIndex];
    navigate(
      `/project/${projectId}/test-cards?experimentName=${encodeURIComponent(
        experiment.experiment_name
      )}`
    );
  };

  const getTypeColor = (type: string) => {
    return type === "Discovery"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-green-100 text-green-800 border-green-200";
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/project/${projectId}/hypotheses`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Hypotheses
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">
                  Experiment Suggestions
                </h1>
                <p className="text-sm text-muted-foreground">
                  FinTech Startup Alpha
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/project/${projectId}/metrics`}>
                  View Metrics
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <div className="text-sm text-muted-foreground">
                Click any experiment to create test card
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {experiments.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  AI Suggestions
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    experiments.filter((e) => e.experiment_type === "Discovery")
                      .length
                  }
                </div>
                <div className="text-sm text-muted-foreground">Discovery</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    experiments.filter(
                      (e) => e.experiment_type === "Validation"
                    ).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">Validation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {experiments.filter((e) => e.priority === "High").length}
                </div>
                <div className="text-sm text-muted-foreground">
                  High Priority
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Experiment Cards */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">
            AI-Generated Experiment Suggestions
          </h2>

          {experiments.map((experiment, index) => {
            const bmcStyle = getBMCBlockStyle(experiment.hypothesis);
            const IconComponent = bmcStyle.icon;

            return (
              <Card
                key={index}
                className={`shadow-card hover:shadow-elegant transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-primary/50 ${bmcStyle.bgColor}`}
                onClick={() => handleExperimentClick(index)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getTypeColor(experiment.experiment_type)}
                        >
                          {experiment.experiment_type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${bmcStyle.iconColor} border-current`}
                        >
                          {bmcStyle.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">
                        {experiment.experiment_name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        <strong>Testing:</strong> {experiment.hypothesis}
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0 ml-4 flex flex-col items-center gap-2">
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

                      {/* Experiment Type Icon */}
                      {/* <div
                        className={`p-2 rounded-lg ${
                          experiment.experiment_type === "Discovery"
                            ? "bg-blue-50 border border-blue-200"
                            : "bg-green-50 border border-green-200"
                        }`}
                      >
                        <FlaskConical
                          className={`h-4 w-4 ${
                            experiment.experiment_type === "Discovery"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        />
                      </div> */}
                    </div>
                    <div className="flex-shrink-0 ml-4 flex flex-col items-center gap-2">
                      <input
                        type="checkbox"
                        checked={aiDoableMap[index] ?? true}
                        onChange={(e) =>
                          handleAiDoableChange(index, e.target.checked)
                        }
                        id={`ai-doable-${index}`}
                      />
                      <label htmlFor={`ai-doable-${index}`} className="text-sm">
                        Experiment By AI
                      </label>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    {experiment.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Cost</div>
                        <div className="text-muted-foreground">
                          {experiment.cost_range}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Runtime</div>
                        <div className="text-muted-foreground">
                          {experiment.runtime}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Success Metric</div>
                        <div className="text-muted-foreground">
                          {experiment.success_metric}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Click to create test card for this experiment
                      </div>
                      {/* <Badge variant="outline" className="text-xs">
                        Create Test Card
                      </Badge> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Panel */}
        {experiments.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50 shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ready to Test Your Ideas</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any experiment above to create a test card and
                    start validating your hypothesis
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {experiments.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Experiments Ready
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExperimentSuggestion;
