import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Lightbulb,
  DollarSign,
  RotateCcw,
  Shield,
  Trash2,
  Zap,
  ArrowRightLeft,
} from "lucide-react";

interface PortfolioProject {
  project_id: string;
  project_name: string;
  sector: string;
  funding_stage: string;
  innovation_risk?: number;
  expected_return?: string;
  status?: string;
  last_updated?: string;
  team_size?: number;
  cost_structure?: string;
  revenue_potential?: string;
  progress?: number;
}

const PortfolioDashboard = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"table" | "scatter">("scatter");
  const [portfolioProjects, setPortfolioProjects] = useState<
    PortfolioProject[]
  >([]);

  // Format currency to millions
  const formatCurrency = (value: string) => {
    if (!value) return "N/A";
    
    // Remove any existing currency symbols and commas
    const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    
    if (isNaN(numericValue)) return value; // Return original if not a number
    
    if (numericValue >= 1000000) {
      const millions = numericValue / 1000000;
      return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
    } else if (numericValue >= 1000) {
      const thousands = numericValue / 1000;
      return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
    } else {
      return `$${numericValue.toLocaleString()}`;
    }
  };

  useEffect(() => {
    // Load projects from localStorage
    try {
      const storedProjects = localStorage.getItem("projects");
      if (storedProjects) {
        const projects = JSON.parse(storedProjects);
        setPortfolioProjects(projects);
      }
    } catch (error) {
      console.error("Error loading projects from localStorage:", error);
    }
  }, []);

  const parseExpectedReturn = (expectedReturn?: string) => {
    if (!expectedReturn) return 0;
    const numericValue = expectedReturn.replace(/[^\d.-]/g, "");
    return parseFloat(numericValue) || 0;
  };

  // Calculate min and max expected returns for proper scaling
  const getExpectedReturnRange = () => {
    const returns = portfolioProjects.map((p) =>
      parseExpectedReturn(p.expected_return)
    );
    if (returns.length === 0) return { min: 0, max: 100000 };

    const min = Math.min(...returns);
    const max = Math.max(...returns);

    // Add 20% tolerance to both ends for better visibility
    const range = max - min;
    const tolerance = Math.max(range * 0.2, 10000); // At least $10k tolerance

    return {
      min: Math.max(0, min - tolerance),
      max: max + tolerance,
    };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "invest":
        return "bg-green-100 text-green-800 border-green-200";
      case "ideate":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pivot":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "preserve":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "retire":
        return "bg-red-100 text-red-800 border-red-200";
      case "spinout":
        return "bg-red-100 text-red-800 border-red-200";
      case "transfer":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "ideate":
        return <Lightbulb className="h-4 w-4" />;
      case "invest":
        return <DollarSign className="h-4 w-4" />;
      case "pivot":
        return <RotateCcw className="h-4 w-4" />;
      case "preserve":
        return <Shield className="h-4 w-4" />;
      case "retire":
        return <Trash2 className="h-4 w-4" />;
      case "spinout":
        return <Zap className="h-4 w-4" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: number) => {
    return "text-red-600";
  };

  const handleDataPointClick = (projectId: string) => {
    navigate(`/project/${projectId}/metrics`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">Portfolio Analysis</h1>
                <p className="text-sm text-muted-foreground">
                  Risk assessment and investment decisions
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("table")}
              >
                Table View
              </Button>
              <Button
                variant={view === "scatter" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("scatter")}
              >
                Scatter Plot
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
              <div className="text-2xl font-bold">
                {portfolioProjects.length}
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Innovation Risk
              </CardTitle>
              <div className="text-2xl font-bold text-yellow-600">
                {portfolioProjects.length > 0
                  ? Math.round(
                      portfolioProjects.reduce(
                        (sum, p) => sum + (p.innovation_risk || 100),
                        0
                      ) / portfolioProjects.length
                    )
                  : 100}
                %
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expected Returns
              </CardTitle>
              <div className="text-2xl font-bold text-green-600">
                {portfolioProjects.length > 0
                  ? formatCurrency(
                      Math.round(
                        portfolioProjects.reduce(
                          (sum, p) =>
                            sum + parseExpectedReturn(p.expected_return),
                          0
                        )
                      ).toString()
                    )
                  : "$0"}
              </div>
            </CardHeader>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ready to Invest
              </CardTitle>
              <div className="text-2xl font-bold text-green-600">
                {portfolioProjects.filter((p) => p.status === "invest").length}
              </div>
            </CardHeader>
          </Card>
        </div>

        {view === "table" ? (
          /* Table View */
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Portfolio Overview</CardTitle>
              <CardDescription>
                Detailed analysis of all projects in the portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Innovation Risk</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolioProjects.map((project) => (
                    <TableRow key={project.project_id}>
                      <TableCell>
                        <div>
                          <Link
                            to={`/project/${project.project_id}/metrics`}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {project.project_name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{project.sector}</Badge>
                      </TableCell>
                      <TableCell>{project.funding_stage}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-red-600`}>
                            {project.innovation_risk || 100}%
                          </span>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-red-500`}
                              style={{
                                width: `${project.innovation_risk || 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {formatCurrency(project.expected_return || "0")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {project.progress || "0 / 0"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(project.status || "ideate")}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(project.status || "ideate")}
                            {project.status || "ideate"}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/project/${project.project_id}/bmc`}>
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* Scatter Plot View */
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Risk vs Return Analysis</CardTitle>
              <CardDescription>
                Visual representation of portfolio risk and expected returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-96 bg-gradient-to-tr from-muted/20 to-background border rounded-lg p-4">
                {/* Get data ranges */}
                {(() => {
                  const returnRange = getExpectedReturnRange();
                  const plotWidth = 100; // Use percentage for full width
                  const plotHeight = 100; // Use percentage for full height

                  return (
                    <>
                      {/* Axes */}
                      <div className="absolute bottom-4 left-4 right-4 h-px bg-border"></div>
                      <div className="absolute bottom-4 left-4 top-4 w-px bg-border"></div>

                      {/* Axis Labels */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-sm text-muted-foreground">
                        Innovation Risk (%) - High to Low
                      </div>
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm text-muted-foreground">
                        Expected Return
                      </div>

                      {/* Data Points */}
                      {portfolioProjects.map((project) => {
                        const riskValue = project.innovation_risk || 0;
                        const returnValue = parseExpectedReturn(
                          project.expected_return
                        );

                        // X-axis: 100-0 from left to right (invert the risk value) - use full width
                        const xPercent = 100 - riskValue;

                        // Y-axis: min to max from bottom to top - use full height
                        const yPercent =
                          ((returnValue - returnRange.min) /
                            (returnRange.max - returnRange.min)) *
                          100;

                        return (
                          <div
                            key={project.project_id}
                            className="absolute group cursor-pointer"
                            style={{
                              left: `calc(${xPercent}% + 16px - 8px)`, // Full width usage with padding adjustment
                              bottom: `calc(${yPercent}% + 16px - 8px)`, // Full height usage with padding adjustment
                            }}
                            onClick={() => handleDataPointClick(project.project_id)}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                project.status === "invest"
                                  ? "bg-green-500 border-green-600"
                                  : project.status === "ideate"
                                  ? "bg-blue-500 border-blue-600"
                                  : project.status === "pivot"
                                  ? "bg-yellow-500 border-yellow-600"
                                  : project.status === "preserve"
                                  ? "bg-yellow-500 border-yellow-600"
                                  : project.status === "retire"
                                  ? "bg-red-500 border-red-600"
                                  : project.status === "spinout"
                                  ? "bg-red-500 border-red-600"
                                  : project.status === "transfer"
                                  ? "bg-green-500 border-green-600"
                                  : "bg-gray-500 border-gray-600"
                              } hover:scale-125 transition-transform shadow-lg`}
                            ></div>

                            {/* Tooltip */}
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-popover border rounded-lg p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                              <div className="font-medium text-sm">
                                {project.project_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Risk: {riskValue}% | Return: {formatCurrency(returnValue.toString())}
                              </div>
                              <div className="text-xs">
                                <Badge
                                  className={`${getStatusColor(
                                    project.status
                                  )} text-xs`}
                                >
                                  {project.status || "N/A"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Quadrant Labels */}
                      <div className="absolute top-8 left-8 text-xs text-muted-foreground font-medium">
                        High Risk, High Return
                      </div>
                      <div className="absolute bottom-8 left-8 text-xs text-muted-foreground font-medium">
                        High Risk, Low Return
                      </div>
                      <div className="absolute bottom-8 right-8 text-xs text-muted-foreground font-medium">
                        Low Risk, Low Return
                      </div>
                      <div className="absolute top-8 right-8 text-xs text-muted-foreground font-medium">
                        Low Risk, High Return
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {[
                  "ideate",
                  "invest",
                  "pivot",
                  "preserve",
                  "retire",
                  "spinout",
                ].map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        status === "invest"
                          ? "bg-green-500"
                          : status === "ideate"
                          ? "bg-blue-500"
                          : status === "pivot"
                          ? "bg-yellow-500"
                          : status === "preserve"
                          ? "bg-yellow-500"
                          : status === "retire"
                          ? "bg-red-500"
                          : status === "spinout"
                          ? "bg-red-500"
                          : status === "transfer"
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    ></div>
                    <span className="text-sm text-muted-foreground capitalize">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PortfolioDashboard;
