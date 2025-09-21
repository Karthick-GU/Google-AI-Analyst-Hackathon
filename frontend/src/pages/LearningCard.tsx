import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  ThumbsUp,
  CheckCircle,
  HelpCircle,
  XCircle,
} from "lucide-react";

const LearningCard = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const [experiment, setExperiment] = useState<any>(null);
  const [insight, setInsight] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);

  const [formData, setFormData] = useState({
    insightName: "",
    dateOfLearning: new Date().toLocaleString(),
    personResponsible: "john",
    hypothesis: "We believed that",
    observation: "We observed",
    learnings: "From that we learned that",
    decisions: "pivot",
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

              // If learning card data exists, use it
              if (foundExperiment.learningCard) {
                const learningData = foundExperiment.learningCard;
                setFormData({
                  insightName: learningData.insightName || foundExperiment.experiment_name || "",
                  dateOfLearning: learningData.dateOfLearning || new Date().toLocaleString(),
                  personResponsible: learningData.personResponsible || "john",
                  hypothesis: learningData.hypothesis || foundExperiment.hypothesis || "",
                  observation: learningData.observation || "We observed",
                  learnings: learningData.learnings || "From that we learned that",
                  decisions: learningData.decisions || "pivot",
                });
                setInsight(learningData.insight || "");
                setConfidence(learningData.confidence || foundExperiment.ai_confidence || 0);
              } else {
                // If no existing learning card data, use experiment data
                setFormData({
                  insightName: foundExperiment.experiment_name || "",
                  dateOfLearning: new Date().toLocaleString(),
                  personResponsible: "john",
                  hypothesis: foundExperiment.hypothesis || "",
                  observation: "We observed",
                  learnings: "From that we learned that",
                  decisions: "pivot",
                });
                setConfidence(foundExperiment.ai_confidence || 0);
              }
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
    // Save learning card data back to experiment in localStorage
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
              // Add learning card data to the experiment
              const learningCardData = {
                insightName: formData.insightName,
                dateOfLearning: formData.dateOfLearning,
                personResponsible: formData.personResponsible,
                hypothesis: formData.hypothesis,
                observation: formData.observation
                  .replace("We observed ", "")
                  .trim(),
                learnings: formData.learnings
                  .replace("From that we learned that ", "")
                  .trim(),
                decisions: formData.decisions,
                insight: insight,
                confidence: confidence,
              };

              // Update the experiment with learning card data
              experiments[experimentIndex] = {
                ...experiments[experimentIndex],
                learningCard: learningCardData,
              };

              // Save back to localStorage
              localStorage.setItem(
                "experimentsList",
                JSON.stringify(experimentsList)
              );
            }
          }
        }
      } catch (error) {
        console.error("Error saving learning card data:", error);
      }
    }

    navigate(`/project/${projectId}/metrics`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/project/${projectId}/test-cards?experimentName=${encodeURIComponent(searchParams.get('experimentName') || '')}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Test Card
            </Link>
          </Button>
          <Button onClick={handleSave} className="gap-2">
            Save & Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Learning Card */}
      <div className="w-[45%] mx-auto">
        <div
          className="rounded-lg p-6 shadow-lg"
          style={{ backgroundColor: "#2dc3ea" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-black">Learning Card</h1>
          </div>

          {/* Top Fields Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <Input
                value={formData.insightName}
                onChange={(e) =>
                  handleInputChange("insightName", e.target.value)
                }
                className="bg-white border-0 text-sm h-8"
                placeholder="Insight Name"
              />
            </div>
            <div>
              <Input
                value={formData.dateOfLearning.slice(0, 10)}
                onChange={(e) =>
                  handleInputChange("dateOfLearning", e.target.value)
                }
                className="bg-white border-0 text-sm h-8"
                placeholder="Date of Learning"
              />
            </div>
            <div className="col-span-2">
              <Input
                value={formData.personResponsible}
                onChange={(e) =>
                  handleInputChange("personResponsible", e.target.value)
                }
                className="bg-white border-0 text-sm h-8"
                placeholder="Person Responsible"
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
              style={{ backgroundColor: "#2dc3ea" }}
            >
              <span className="text-sm font-medium text-black">
                We believed that
              </span>
            </div>
            <Textarea
              value={formData.hypothesis}
              onChange={(e) => handleInputChange("hypothesis", e.target.value)}
              className="bg-white border-0 text-sm min-h-[80px] resize-none"
              placeholder=""
            />
          </div>

          {/* Step 2: Observation */}
          <div className="mb-6">
            <div className="text-xs font-medium text-black mb-2">
              STEP 2: OBSERVATION
            </div>
            <div
              className="p-2 rounded mb-2"
              style={{ backgroundColor: "#2dc3ea" }}
            >
              <span className="text-sm font-medium text-black">
                We observed
              </span>
            </div>
            <Textarea
              value={formData.observation.replace("We observed", "").trim()}
              onChange={(e) =>
                handleInputChange(
                  "observation",
                  `We observed ${e.target.value}`
                )
              }
              className="bg-white border-0 text-sm min-h-[80px] resize-none"
              placeholder=""
            />
            <div className="flex justify-end items-center mt-2">
              <span className="text-xs text-gray-600 mr-2">
                Data Reliability:
              </span>
              <div className="flex gap-1">
                <ThumbsUp className="h-3 w-3 text-gray-600" />
                <ThumbsUp className="h-3 w-3 text-gray-600" />
                <ThumbsUp className="h-3 w-3 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Step 3: Learnings and Insights */}
          <div className="mb-6">
            <div className="text-xs font-medium text-black mb-2">
              STEP 3: LEARNINGS AND INSIGHTS
            </div>
            <div
              className="p-2 rounded mb-2"
              style={{ backgroundColor: "#2dc3ea" }}
            >
              <span className="text-sm font-medium text-black">
                From that we learned that
              </span>
            </div>
            <Textarea
              value={formData.learnings
                .replace("From that we learned that", "")
                .trim()}
              onChange={(e) =>
                handleInputChange(
                  "learnings",
                  `From that we learned that ${e.target.value}`
                )
              }
              className="bg-white border-0 text-sm min-h-[80px] resize-none"
              placeholder=""
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 mr-2">Insight:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`w-8 h-8 rounded-full p-0 ${
                      insight === "support"
                        ? "bg-green-500 text-white border-green-500 hover:bg-green-600"
                        : "hover:bg-green-100"
                    }`}
                    onClick={() => setInsight("support")}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`w-8 h-8 rounded-full p-0 ${
                      insight === "unclear"
                        ? "bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
                        : "hover:bg-yellow-100"
                    }`}
                    onClick={() => setInsight("unclear")}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`w-8 h-8 rounded-full p-0 ${
                      insight === "refute"
                        ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                        : "hover:bg-red-100"
                    }`}
                    onClick={() => setInsight("refute")}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Confidence:</span>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-yellow-500"
                    style={{
                      width: `${confidence}%`,
                    }}
                  ></div>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(e) =>
                    setConfidence(
                      Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                    )
                  }
                  className="w-12 text-xs text-center border rounded px-1 py-0.5"
                />
                <span className="text-xs text-gray-600">%</span>
              </div>
            </div>
          </div>

          {/* Step 4: Decisions and Actions */}
          <div className="mb-6">
            <div className="text-xs font-medium text-black mb-2">
              STEP 4: DECISIONS AND ACTIONS
            </div>
            <div
              className="p-2 rounded mb-2"
              style={{ backgroundColor: "#2dc3ea" }}
            >
              <span className="text-sm font-medium text-black">
                Therefore, we will
              </span>
            </div>
            <Select
              value={formData.decisions}
              onValueChange={(value) => handleInputChange("decisions", value)}
            >
              <SelectTrigger className="bg-white border-0 text-sm">
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pivot">Pivot</SelectItem>
                <SelectItem value="shelve/kill">Shelve/Kill</SelectItem>
                <SelectItem value="preserve">Preserve</SelectItem>
                <SelectItem value="test again">Test Again</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningCard;
