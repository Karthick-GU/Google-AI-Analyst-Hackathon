import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  FlaskConical,
  Target,
  AlertTriangle,
  Banknote,
  PiggyBank,
  Lightbulb,
  DollarSign as InvestIcon,
  RotateCcw,
  Shield,
  Trash2,
  Zap,
  ArrowRightLeft,
  ArrowRight,
} from "lucide-react";

interface ExperimentData {
  experiment_name: string;
  hypothesis: string;
  experiment_type: string;
  cost_range: string;
  runtime: string;
  priority: string;
  ai_confidence: number;
  learningCard?: {
    insight: string;
    confidence: number;
    decisions: string;
    hypothesis: string;
    observation: string;
    learnings: string;
    dateOfLearning: string;
    insightName: string;
    personResponsible: string;
  };
}

interface HypothesisGroup {
  hypothesis: string;
  experiments: ExperimentData[];
  totalCost: number;
  riskWeight: number;
  mostRecentExperiment: ExperimentData | null;
  riskReduction: string;
}

const ProjectMetrics = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [projectName, setProjectName] = useState<string>("");
  const [projectData, setProjectData] = useState<any>(null);
  const [activeAction, setActiveAction] = useState<string>("ideate");

  useEffect(() => {
    if (projectId) {
      try {
        // Load project name
        const storedProjects = localStorage.getItem("projects");
        if (storedProjects) {
          const projects = JSON.parse(storedProjects);
          const currentProject = projects.find(
            (project: any) => project.project_id.toString() === projectId
          );
          if (currentProject) {
            setProjectName(currentProject.project_name || "Project");
            setProjectData(currentProject);
            // Set active action from stored status, default to "ideate" if not found
            setActiveAction(currentProject.status || "ideate");
          }
        }

        // Load experiments data
        const storedExperimentsList = localStorage.getItem("experimentsList");
        if (storedExperimentsList) {
          const experimentsList = JSON.parse(storedExperimentsList);
          const experimentsEntry = experimentsList.find(
            (entry: any) => entry.projectId.toString() === projectId
          );

          if (experimentsEntry && experimentsEntry.experiments) {
            setExperiments(experimentsEntry.experiments);
          }
        }
      } catch (error) {
        console.error("Error loading project metrics data:", error);
      }
    }
  }, [projectId]);

  const getInsightIcon = (insight: string) => {
    switch (insight) {
      case "support":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "refute":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "unclear":
        return <HelpCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getInsightBadge = (insight: string) => {
    switch (insight) {
      case "support":
        return <Badge className="bg-green-100 text-green-800">Support</Badge>;
      case "refute":
        return <Badge className="bg-red-100 text-red-800">Refute</Badge>;
      case "unclear":
        return <Badge className="bg-yellow-100 text-yellow-800">Unclear</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case "pivot":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "preserve":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "shelve/kill":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "test again":
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRiskReduction = (experiment: ExperimentData) => {
    if (!experiment.learningCard) return "0%";

    const insight = experiment.learningCard.insight;

    // Return 0 if insight is "refute" or "unclear"
    if (insight === "refute" || insight === "unclear" || insight === "") {
      return "0%";
    }

    const riskPercentage = getRiskWeight(experiment.hypothesis);
    const confidencePercentage = experiment.learningCard.confidence || 0;

    // Risk Reduction = Risk% × Confidence%
    const riskReduction = (riskPercentage * confidencePercentage) / 100;

    return `${riskReduction.toFixed(1)}%`;
  };

  const getRiskReductionForHypothesis = (group: HypothesisGroup) => {
    if (!group.mostRecentExperiment?.learningCard) return "0%";

    const insight = group.mostRecentExperiment.learningCard.insight;

    // Return 0 if insight is "refute" or "unclear"
    if (insight === "refute" || insight === "unclear" || insight === "") {
      return "0%";
    }

    const riskPercentage = group.riskWeight;
    const confidencePercentage =
      group.mostRecentExperiment.learningCard.confidence || 0;

    // Risk Reduction = Risk% × Confidence%
    const riskReduction = (riskPercentage * confidencePercentage) / 100;

    return `${riskReduction.toFixed(1)}%`;
  };

  const getRiskWeight = (experimentHypothesis: string) => {
    if (!projectId) return 0;

    try {
      const storedHypothesesList = localStorage.getItem("hypothesesList");
      if (storedHypothesesList) {
        const hypothesesList = JSON.parse(storedHypothesesList);
        const hypothesesEntry = hypothesesList.find(
          (entry: any) => entry.projectId.toString() === projectId
        );

        if (hypothesesEntry && hypothesesEntry.hypotheses) {
          const hypothesis = hypothesesEntry.hypotheses.find(
            (h: any) => h.hypothesis === experimentHypothesis
          );

          if (hypothesis) {
            return hypothesis.risk_weight || 0;
          }
        }
      }
    } catch (error) {
      console.error("Error loading hypotheses data:", error);
    }

    return 0;
  };

  // Group experiments by hypothesis
  const groupExperimentsByHypothesis = (): HypothesisGroup[] => {
    const groups = new Map<string, HypothesisGroup>();

    experiments.forEach((experiment) => {
      const hypothesis = experiment.hypothesis;

      if (!groups.has(hypothesis)) {
        groups.set(hypothesis, {
          hypothesis,
          experiments: [],
          totalCost: 0,
          riskWeight: getRiskWeight(hypothesis),
          mostRecentExperiment: null,
          riskReduction: "0%",
        });
      }

      const group = groups.get(hypothesis)!;
      group.experiments.push(experiment);

      // Calculate total cost for this hypothesis
      console.log("Experiment cost range:", experiment.cost_range);
      const cost = experiment.cost_range.split("-")[1]?.replace(/[^\d]/g, "");
      group.totalCost += parseInt(cost) || 0;
    });

    // Find most recent experiment for each hypothesis and calculate risk reduction
    groups.forEach((group) => {
      const experimentsWithLearningCard = group.experiments.filter(
        (exp) => exp.learningCard?.dateOfLearning
      );

      if (experimentsWithLearningCard.length > 0) {
        // Sort by dateOfLearning to find most recent
        experimentsWithLearningCard.sort((a, b) => {
          const dateA = new Date(a.learningCard!.dateOfLearning).getTime();
          const dateB = new Date(b.learningCard!.dateOfLearning).getTime();
          return dateB - dateA; // Most recent first
        });

        group.mostRecentExperiment = experimentsWithLearningCard[0];
        group.riskReduction = getRiskReductionForHypothesis(group);
      }
    });

    return Array.from(groups.values());
  };

  const hypothesisGroups = groupExperimentsByHypothesis();
  const completedExperiments = experiments.filter((exp) => exp.learningCard);
  const totalBudget = hypothesisGroups.reduce(
    (sum, group) => sum + group.totalCost,
    0
  );

  const getInnovationRiskLevel = () => {
    const totalRiskReduction = hypothesisGroups.reduce((sum, group) => {
      if (!group.mostRecentExperiment?.learningCard) return sum;

      const insight = group.mostRecentExperiment.learningCard.insight;

      // Return 0 if insight is "refute" or "unclear"
      if (insight === "refute" || insight === "unclear" || insight === "") {
        return sum;
      }

      const riskPercentage = group.riskWeight;
      const confidencePercentage =
        group.mostRecentExperiment.learningCard.confidence || 0;

      // Risk Reduction = Risk% × Confidence%
      const riskReduction = (riskPercentage * confidencePercentage) / 100;

      return sum + riskReduction;
    }, 0);

    const innovationRiskLevel = Math.max(0, 100 - totalRiskReduction);
    return innovationRiskLevel.toFixed(1);
  };

  const parseMoneyValue = (value: string) => {
    if (!value) return 0;
    const numericValue = value.replace(/[^\d.-]/g, "");
    return parseFloat(numericValue) || 0;
  };

  const formatMoney = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const getCostStructure = () => {
    if (!projectData?.cost_structure) return "N/A";
    const value = parseMoneyValue(projectData.cost_structure);
    return value > 0 ? formatMoney(value) : projectData.cost_structure;
  };

  const getRevenuePotential = () => {
    if (!projectData?.revenue_potential) return "N/A";
    const value = parseMoneyValue(projectData.revenue_potential);
    return value > 0 ? formatMoney(value) : projectData.revenue_potential;
  };

  const getExpectedReturn = () => {
    const cost = parseMoneyValue(projectData?.cost_structure || "0");
    const revenue = parseMoneyValue(projectData?.revenue_potential || "0");
    const expectedReturn = revenue - cost;
    return formatMoney(expectedReturn);
  };

  const actionButtons = [
    { id: "ideate", icon: Lightbulb, label: "Ideate", color: "blue" },
    { id: "invest", icon: InvestIcon, label: "Invest", color: "green" },
    { id: "pivot", icon: RotateCcw, label: "Pivot", color: "yellow" },
    { id: "preserve", icon: Shield, label: "Preserve", color: "yellow" },
    { id: "retire", icon: Trash2, label: "Retire", color: "red" },
    { id: "spinout", icon: Zap, label: "Spinout", color: "red" },
    // { id: "transfer", icon: ArrowRightLeft, label: "Transfer", color: "green" },
  ];

  const getButtonVariant = (action: any) => {
    return "ghost" as const;
  };

  const getButtonColor = (action: any) => {
    if (activeAction === action.id) {
      switch (action.color) {
        case "blue":
          return "bg-blue-600 text-white hover:bg-blue-700";
        case "green":
          return "bg-green-600 text-white hover:bg-green-700";
        case "yellow":
          return "bg-yellow-600 text-white hover:bg-yellow-700";
        case "red":
          return "bg-red-600 text-white hover:bg-red-700";
        default:
          return "bg-blue-600 text-white hover:bg-blue-700";
      }
    }

    switch (action.color) {
      case "blue":
        return "text-blue-600 hover:text-blue-700 hover:bg-blue-50";
      case "green":
        return "text-green-600 hover:text-green-700 hover:bg-green-50";
      case "yellow":
        return "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50";
      case "red":
        return "text-red-600 hover:text-red-700 hover:bg-red-50";
      default:
        return "";
    }
  };

  const saveProjectMetrics = (status: string) => {
    if (!projectId) return;

    try {
      const storedProjects = localStorage.getItem("projects");
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        const projectIndex = projects.findIndex(
          (project: any) => project.project_id.toString() === projectId
        );

        if (projectIndex !== -1) {
          // Calculate current metrics
          const innovationRisk = parseFloat(getInnovationRiskLevel());
          const expectedReturn = getExpectedReturn();

          // Update project with metrics data
          projects[projectIndex] = {
            ...projects[projectIndex],
            innovation_risk: innovationRisk,
            expected_return: expectedReturn,
            status: status,
            progress: `${completedExperiments.length} / ${experiments.length}`,
            last_updated: new Date().toISOString(),
          };

          // Save back to localStorage
          localStorage.setItem("projects", JSON.stringify(projects));
        }
      }
    } catch (error) {
      console.error("Error saving project metrics:", error);
    }
  };

  const handleActionClick = (actionId: string) => {
    setActiveAction(actionId);
    saveProjectMetrics(actionId);
  };

  const handlePortfolioClick = () => {
    // Save current project metrics with the current active action
    saveProjectMetrics(activeAction);
    // Navigate to portfolio
    navigate("/portfolio");
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
                  Back to Project
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold">{projectName}</h1>
                <p className="text-lg text-muted-foreground">Project Metrics</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border rounded-lg p-2">
                {actionButtons.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant={getButtonVariant(action)}
                      size="sm"
                      className={`h-8 w-8 p-0 ${getButtonColor(action)}`}
                      onClick={() => handleActionClick(action.id)}
                      title={action.label}
                    >
                      <IconComponent className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortfolioClick}
              >
                Portfolio
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {hypothesisGroups.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Hypotheses
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {completedExperiments.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${totalBudget.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Overall Test Cost
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {getInnovationRiskLevel()}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Innovation Risk Level
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Experiments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Experiment Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hypothesis</TableHead>
                  <TableHead>Experiments</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Insight</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk Reduction</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hypothesisGroups.map((group, index) => (
                  <TableRow key={index}>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={group.hypothesis}>
                        {group.hypothesis}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        {group.experiments.map((experiment, expIndex) => (
                          <Link
                            key={expIndex}
                            to={`/project/${projectId}/learning-card?experimentName=${encodeURIComponent(experiment.experiment_name)}`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer block text-sm"
                            title={experiment.experiment_name}
                          >
                            {experiment.experiment_name}
                            {/* {group.mostRecentExperiment === experiment && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                Latest
                              </span>
                            )} */}
                          </Link>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {group.totalCost.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-medium">
                        {group.riskWeight}%
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getInsightIcon(
                          group.mostRecentExperiment?.learningCard?.insight ||
                            ""
                        )}
                        {getInsightBadge(
                          group.mostRecentExperiment?.learningCard?.insight ||
                            ""
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">
                          {group.mostRecentExperiment?.learningCard
                            ?.confidence ||
                            group.mostRecentExperiment?.ai_confidence ||
                            0}
                          %
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-sm font-medium">
                        {group.riskReduction}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDecisionIcon(
                          group.mostRecentExperiment?.learningCard?.decisions ||
                            ""
                        )}
                        <span className="text-sm capitalize">
                          {group.mostRecentExperiment?.learningCard
                            ?.decisions || "Pending"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Financial Summary Cards */}
        <div className="flex justify-end">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      {getCostStructure()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cost Structure
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  <div>
                    <div className="text-xl font-bold text-green-600">
                      {getRevenuePotential()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Revenue Potential
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <PiggyBank className="h-6 w-6 text-purple-600" />
                  <div>
                    <div className="text-xl font-bold text-purple-600">
                      {getExpectedReturn()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expected Return
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMetrics;
