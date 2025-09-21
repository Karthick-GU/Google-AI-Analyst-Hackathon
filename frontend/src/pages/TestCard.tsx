import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Triangle,
  DollarSign,
  BarChart3,
  ThumbsUp,
  Clock,
} from "lucide-react";

const TestCard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const [experiment, setExperiment] = useState<any>(null);
  const [formData, setFormData] = useState({
    testName: "",
    deadline: "",
    assignedTo: "john",
    duration: "",
    hypothesis: "We believe that",
    test: "To verify that, we will",
    metric: "And measure",
    criteria: "We are right if",
    costRange: "",
  });

  // Load experiment data from localStorage using URL parameters
  useEffect(() => {
    const experimentName = searchParams.get('experimentName');
    if (experimentName && projectId) {
      try {
        const storedExperimentsList = localStorage.getItem("experimentsList");
        if (storedExperimentsList) {
          const experimentsList = JSON.parse(storedExperimentsList);
          const projectIndex = experimentsList.findIndex(
            (entry: any) => entry.projectId.toString() === projectId
          );

          if (projectIndex !== -1) {
            const experiments = experimentsList[projectIndex].experiments;
            const foundExperiment = experiments.find(
              (exp: any) => exp.experiment_name === experimentName
            );

            if (foundExperiment) {
              setExperiment(foundExperiment);
              setFormData({
                testName: foundExperiment.experiment_name || "",
                deadline: "01-12-2025",
                assignedTo: "john",
                duration: foundExperiment.runtime || "",
                hypothesis: `We believe that ${foundExperiment.hypothesis || ""}`,
                test: `To verify that, we will ${foundExperiment.testing_statement || ""}`,
                metric: `And measure ${foundExperiment.measurement || ""}`,
                criteria: `We are right if ${foundExperiment.success_metric || ""}`,
                costRange: foundExperiment.cost_range || "",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading experiment from localStorage:", error);
      }
    }
  }, [searchParams, projectId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Update the experiment data in localStorage if we have the experiment
    if (experiment && projectId) {
      try {
        const storedExperimentsList = localStorage.getItem("experimentsList");
        if (storedExperimentsList) {
          const experimentsList = JSON.parse(storedExperimentsList);
          const projectIndex = experimentsList.findIndex(
            (entry: any) => entry.projectId.toString() === projectId
          );

          if (projectIndex !== -1) {
            const experiments = experimentsList[projectIndex].experiments;
            
            // Find the experiment to update by matching experiment_name
            const experimentIndex = experiments.findIndex(
              (exp: any) => exp.experiment_name === experiment.experiment_name
            );

            if (experimentIndex !== -1) {
              // Update the experiment with modified form data
              const updatedExperiment = {
                ...experiments[experimentIndex],
                experiment_name: formData.testName,
                runtime: formData.duration,
                hypothesis: formData.hypothesis.replace("We believe that ", "").trim(),
                testing_statement: formData.test.replace("To verify that, we will ", "").trim(),
                measurement: formData.metric.replace("And measure ", "").trim(),
                success_metric: formData.criteria.replace("We are right if ", "").trim(),
                cost_range: formData.costRange
              };

              // Update the experiment in the array
              experiments[experimentIndex] = updatedExperiment;
              
              // Save back to localStorage
              localStorage.setItem("experimentsList", JSON.stringify(experimentsList));
            }
          }
        }
      } catch (error) {
        console.error("Error updating experiment data:", error);
      }
    }

    // Navigate to learning card with experiment name parameter
    const experimentName = experiment?.experiment_name || formData.testName;
    navigate(`/project/${projectId}/learning-card?experimentName=${encodeURIComponent(experimentName)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/project/${projectId}/experiments`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Experiments
            </Link>
          </Button>
          <Button onClick={handleSave} className="gap-2">
            Save & Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Test Card */}
      <div className="w-[45%] mx-auto">
        <div
          className="rounded-lg p-6 shadow-lg"
          style={{ backgroundColor: "#9abb4d" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-black">Test Card</h1>
          </div>

          {/* Top Fields Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <Input
                value={formData.testName}
                onChange={(e) => handleInputChange("testName", e.target.value)}
                className="bg-white border-0 text-sm h-8"
                placeholder="Test Name"
              />
            </div>
            <div>
              <Input
                value={formData.deadline}
                onChange={(e) => handleInputChange("deadline", e.target.value)}
                className="bg-white border-0 text-sm h-8"
                placeholder="Deadline"
              />
            </div>
            <div>
              <Input
                value={formData.assignedTo}
                onChange={(e) =>
                  handleInputChange("assignedTo", e.target.value)
                }
                className="bg-white border-0 text-sm h-8"
                placeholder="Assigned to"
              />
            </div>
            <div>
              <Input
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                className="bg-white border-0 text-sm h-8"
                placeholder="Duration"
              />
            </div>
          </div>

          {/* Step 1: Hypothesis */}
          <div className="mb-6">
            <div className="text-xs font-medium text-black mb-2">
              STEP 1: HYPOTHESIS
            </div>
            <div
              className="p-2 rounded mb-2"
              style={{ backgroundColor: "#9abb4d" }}
            >
              <span className="text-sm font-medium text-black">
                We believe that
              </span>
            </div>
            <Textarea
              value={formData.hypothesis.replace("We believe that", "").trim()}
              onChange={(e) =>
                handleInputChange(
                  "hypothesis",
                  `We believe that ${e.target.value}`
                )
              }
              className="bg-white border-0 text-sm min-h-[80px] resize-none"
              placeholder=""
            />
            <div className="flex justify-end mt-2">
              <span className="text-xs text-gray-600 mr-2">Critical:</span>
              <div className="flex gap-1">
                <Triangle className="h-3 w-3 text-gray-600 fill-current" />
                <Triangle className="h-3 w-3 text-gray-600 fill-current" />
                <Triangle className="h-3 w-3 text-gray-600 fill-current" />
              </div>
            </div>
          </div>

          {/* Step 2: Test */}
          <div className="mb-6">
            <div className="text-xs font-medium text-black mb-2">
              STEP 2: TEST
            </div>
            <div
              className="p-2 rounded mb-2"
              style={{ backgroundColor: "#9abb4d" }}
            >
              <span className="text-sm font-medium text-black">
                To verify that, we will
              </span>
            </div>
            <Textarea
              value={formData.test
                .replace("To verify that, we will", "")
                .trim()}
              onChange={(e) =>
                handleInputChange(
                  "test",
                  `To verify that, we will ${e.target.value}`
                )
              }
              className="bg-white border-0 text-sm min-h-[80px] resize-none"
              placeholder=""
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Test Cost:</span>
                <span className="text-xs text-gray-800 font-medium">
                  ${formData.costRange}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Data Reliability:</span>
                <div className="flex gap-1">
                  <ThumbsUp className="h-3 w-3 text-gray-600" />
                  <ThumbsUp className="h-3 w-3 text-gray-600" />
                  <ThumbsUp className="h-3 w-3 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Metric */}
          <div className="mb-6">
            <div className="text-xs font-medium text-black mb-2">
              STEP 3: METRIC
            </div>
            <div
              className="p-2 rounded mb-2"
              style={{ backgroundColor: "#9abb4d" }}
            >
              <span className="text-sm font-medium text-black">
                And measure
              </span>
            </div>
            <Textarea
              value={formData.metric.replace("And measure", "").trim()}
              onChange={(e) =>
                handleInputChange("metric", `And measure ${e.target.value}`)
              }
              className="bg-white border-0 text-sm min-h-[80px] resize-none"
              placeholder=""
            />
            <div className="flex justify-end items-center mt-2">
              <span className="text-xs text-gray-600 mr-2">Time Required:</span>
              <div className="flex gap-1">
                <Clock className="h-3 w-3 text-gray-600" />
                <Clock className="h-3 w-3 text-gray-600" />
                <Clock className="h-3 w-3 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Step 4: Criteria */}
          <div className="mb-6">
            <div className="text-xs font-medium text-black mb-2">
              STEP 4: CRITERIA
            </div>
            <div
              className="p-2 rounded mb-2"
              style={{ backgroundColor: "#9abb4d" }}
            >
              <span className="text-sm font-medium text-black">
                We are right if
              </span>
            </div>
            <Textarea
              value={formData.criteria.replace("We are right if", "").trim()}
              onChange={(e) =>
                handleInputChange(
                  "criteria",
                  `We are right if ${e.target.value}`
                )
              }
              className="bg-white border-0 text-sm min-h-[80px] resize-none"
              placeholder=""
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCard;
