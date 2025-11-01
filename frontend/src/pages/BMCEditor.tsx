import React, { useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import BusinessModelCanvas from "@/components/BusinessModelCanvas";

const BMCEditor = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation();
  const [isApproved, setIsApproved] = useState(false);

  // Get bmcData from navigation state
  const bmcData = location.state?.bmcData;

  const handleApproveBMC = async () => {
    try {
      setIsApproved(true);

      // Check if hypotheses already exist for this project
      const storedHypothesesList = localStorage.getItem("hypothesesList");
      if (storedHypothesesList) {
        try {
          const hypothesesList = JSON.parse(storedHypothesesList);
          const existingHypotheses = hypothesesList.find(
            (entry: any) => entry.projectId.toString() === projectId
          );

          if (
            existingHypotheses &&
            existingHypotheses.hypotheses &&
            existingHypotheses.hypotheses.length > 0
          ) {
            // Hypotheses already exist, redirect directly
            navigate(`/project/${projectId}/hypotheses`);
            return;
          }
        } catch (error) {
          console.error("Error parsing existing hypotheses:", error);
        }
      }

      // Get project data and BMC data using projectId
      const storedProjects = localStorage.getItem("projects");
      const storedBMCDataList = localStorage.getItem("bmcDataList");

      if (!storedProjects || !storedBMCDataList) {
        throw new Error("Project or BMC data not found");
      }

      const projects = JSON.parse(storedProjects);
      const bmcDataList = JSON.parse(storedBMCDataList);

      // Find the current project
      const currentProject = projects.find(
        (project: any) => project.project_id.toString() === projectId
      );

      // Find the BMC data for this project
      const bmcEntry = bmcDataList.find(
        (entry: any) => entry.projectId.toString() === projectId
      );

      if (!currentProject || !bmcEntry) {
        throw new Error("Project or BMC data not found for this project ID");
      }

      // Prepare API request data
      const requestData = {
        bmc_data: bmcEntry.bmcData,
        project_description: currentProject.project_description,
        sector: currentProject.sector,
      };

      // Call the hypotheses generation API
      const response = await fetch(
        "https://gg-api-243440749681.europe-west1.run.app/run_hypotheses_agent",
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

      // Store hypotheses in localStorage
      let existingHypothesesList = localStorage.getItem("hypothesesList");
      let hypothesesList: any[] = [];

      if (existingHypothesesList) {
        try {
          hypothesesList = JSON.parse(existingHypothesesList);
        } catch {
          hypothesesList = [];
        }
      }

      // Add the new hypotheses with projectId
      hypothesesList.push({
        hypotheses: result.hypotheses,
        projectId: parseInt(projectId!),
      });

      localStorage.setItem("hypothesesList", JSON.stringify(hypothesesList));

      // Navigate to hypotheses page
      setTimeout(() => {
        navigate(`/project/${projectId}/hypotheses`);
      }, 1000);
    } catch (error) {
      console.error("Error generating hypotheses:", error);
      alert("Failed to generate hypotheses. Please try again.");
      setIsApproved(false); // Reset approval state on error
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
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-semibold">Business Model Canvas</h1>
                <p className="text-sm text-muted-foreground">
                  FinTech Startup Alpha
                </p>
              </div>
            </div>
            {isApproved && (
              <Button asChild disabled={isApproved}>
                <Link to={`/project/${projectId}/hypotheses`}>
                  Generating...
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <BusinessModelCanvas
          isApproved={isApproved}
          onApprove={handleApproveBMC}
        />
      </div>
    </div>
  );
};

export default BMCEditor;
