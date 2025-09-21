import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, BarChart3, Target, FlaskConical, DollarSign, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";

interface Project {
  project_id: number;
  project_name: string;
  project_description: string;
  sector: string;
  funding_stage: string;
  team_size: number;
  project_document: string;
  cost_structure?: string;
  revenue_potential?: string;
}

const defaultProjects: Project[] = [];

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);

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

  // Load projects from localStorage on component mount
  useEffect(() => {
    const loadProjects = () => {
      try {
        const storedProjects = localStorage.getItem("projects");
        if (storedProjects) {
          const parsedProjects = JSON.parse(storedProjects);
          setProjects(parsedProjects);
        } else {
          // If no projects in localStorage, use default projects and save them
          setProjects(defaultProjects);
          localStorage.setItem("projects", JSON.stringify(defaultProjects));
        }
      } catch (error) {
        console.error("Error loading projects from localStorage:", error);
        setProjects(defaultProjects);
      }
    };

    loadProjects();
  }, []);
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Startup Analyst</h1>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/portfolio">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Portfolio View
                </Link>
              </Button>
              <Button variant="default" asChild>
                <Link to="/project/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Business analysis dashboard"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        </div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">
              Startup Analyst - VC Core
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Turning Validated Models into Smart Investment Choices
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                BMC Generation
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Hypothesis Testing
              </div>
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Experiment Design
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Portfolio Analysis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-2">Active Projects</h3>
          <p className="text-muted-foreground">
            Monitor and analyze your startup portfolio
          </p>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.project_id}
                className="shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {project.project_name}
                      </CardTitle>
                      <CardDescription>
                        {project.sector} • {project.funding_stage}
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      <p className="line-clamp-2">
                        {project.project_description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Team Size</span>
                      <span className="font-medium">
                        {project.team_size} members
                      </span>
                    </div>
                    
                    {/* Financial Overview */}
                    {(project.cost_structure || project.revenue_potential) && (
                      <div className="flex items-center justify-between pt-2 border-t border-muted">
                        {/* Invest (Left) */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-muted-foreground">Invest</span>
                          </div>
                          <span className="font-semibold text-red-600">
                            {formatCurrency(project.cost_structure || "")}
                          </span>
                        </div>
                        
                        {/* Return (Right) */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Return</span>
                          </div>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(project.revenue_potential || "")}
                          </span>
                        </div>
                      </div>
                    )}
                    {project.project_document && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Documents:{" "}
                        </span>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {project.project_document.split(", ").length} file(s)
                        </span>
                      </div>
                    )}
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/project/${project.project_id}/bmc`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first project to begin analyzing
                startup opportunities.
              </p>
              <Button asChild>
                <Link to="/project/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
