// localStorage import utility
export interface LocalStorageData {
  [key: string]: string;
}

// Flag to track if data has been imported
const IMPORT_FLAG_KEY = "localStorage_imported";

// Check if localStorage has essential data
const hasEssentialData = (): boolean => {
  try {
    const projects = localStorage.getItem("projects");
    const experimentsList = localStorage.getItem("experimentsList");
    const bmcDataList = localStorage.getItem("bmcDataList");
    const hypothesesList = localStorage.getItem("hypothesesList");

    // Check if data exists AND contains meaningful content (not empty arrays/objects)
    const hasProjects =
      projects && projects !== "[]" && JSON.parse(projects).length > 0;
    const hasExperiments =
      experimentsList &&
      experimentsList !== "[]" &&
      JSON.parse(experimentsList).length > 0;
    const hasBmcData =
      bmcDataList && bmcDataList !== "[]" && JSON.parse(bmcDataList).length > 0;
    const hasHypotheses =
      hypothesesList &&
      hypothesesList !== "[]" &&
      JSON.parse(hypothesesList).length > 0;

    return !!(hasProjects || hasExperiments || hasBmcData || hasHypotheses);
  } catch (error) {
    // If JSON parsing fails, assume no essential data
    console.warn("Error parsing localStorage data:", error);
    return false;
  }
};

// Check if data has already been imported
const hasBeenImported = (): boolean => {
  return localStorage.getItem(IMPORT_FLAG_KEY) === "true";
};

// Import localStorage data from APIs
export const importLocalStorage = async (): Promise<boolean> => {
  try {
    console.log("Starting API import...");

    // Fetch Projects Data
    const projectsResponse = await fetch(
      "https://google-hackathon-api-161123521898.asia-south1.run.app/get_all_project_data"
    );
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      if (projectsData.projects_data) {
        const mappedProjects = projectsData.projects_data.map((p: any) => ({
          project_id: Number.parseInt(p["project-id"] || "0"),
          project_name: p.project_name,
          project_description: p.project_description,
          sector: p.sector,
          funding_stage: p.funding_stage,
          team_size: Number.parseInt(p.team_size || "0"),
          project_document: p.project_document,
          cost_structure: p.cost_structure,
          revenue_potential: p.revenue_potential,
        }));
        localStorage.setItem("projects", JSON.stringify(mappedProjects));
      }
    }

    // Fetch All Other Data (BMC, Hypotheses, Experiments)
    const response = await fetch(
      "https://google-hackathon-api-161123521898.asia-south1.run.app/get_all_data"
    );

    if (!response.ok) {
      console.error("API get_all_data failed");
      return false;
    }

    const data = await response.json();

    // Process BMC Data
    if (data.bmc_data) {
      const bmcDataList = data.bmc_data.map((item: any) => {
        const bmcData: any = {};
        // Parse each BMC field which is a stringified JSON array
        Object.keys(item).forEach((key) => {
          if (key !== "project-id") {
            try {
              bmcData[key] = JSON.parse(item[key]);
            } catch (e) {
              // If parsing fails, keep as is (or empty array)
              console.warn(`Failed to parse BMC data for key ${key}:`, e);
              bmcData[key] = item[key];
            }
          }
        });
        return {
          projectId: Number.parseInt(item["project-id"]),
          bmcData: bmcData,
        };
      });
      localStorage.setItem("bmcDataList", JSON.stringify(bmcDataList));
    }

    // Process Hypotheses Data
    if (data.hypotheses_data) {
      const hypothesesList = data.hypotheses_data.map((item: any) => ({
        projectId: Number.parseInt(item["project-id"]),
        hypotheses: JSON.parse(item.hypotheses || "[]"),
      }));
      localStorage.setItem("hypothesesList", JSON.stringify(hypothesesList));
    }

    // Process Experiments Data
    if (data.experiments_data) {
      const experimentsList = data.experiments_data.map((item: any) => ({
        projectId: Number.parseInt(item["project-id"]),
        experiments: JSON.parse(item.experiments || "[]"),
      }));
      localStorage.setItem("experimentsList", JSON.stringify(experimentsList));
    }

    // Set import flag
    localStorage.setItem(IMPORT_FLAG_KEY, "true");

    console.log("localStorage imported successfully from APIs");
    return true;
  } catch (error) {
    console.error("Error importing localStorage:", error);
    return false;
  }
};

// Auto-import function that runs on startup
export const autoImportOnStartup = async (): Promise<void> => {
  console.log("in");
  // Only import if:
  // 1. No essential data exists in localStorage AND
  // 2. Data hasn't been imported before
  if (!hasEssentialData() && !hasBeenImported()) {
    console.log("Auto-importing localStorage data...");
    const success = await importLocalStorage();

    if (success) {
      // Reload the page to reflect imported data
      globalThis.location.reload();
    } else {
      // Mark as attempted to avoid trying again
      localStorage.setItem(IMPORT_FLAG_KEY, "true");
    }
  }
};

// Export localStorage data to JSON file (for development/backup purposes)
export const exportLocalStorage = (): void => {
  const data: LocalStorageData = {};

  // Export all localStorage data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      data[key] = localStorage.getItem(key) || "";
    }
  }

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `localStorage_backup_${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();

  // Clean up
  URL.revokeObjectURL(link.href);
};

// Reset import flag (useful for testing)
export const resetImportFlag = (): void => {
  localStorage.removeItem(IMPORT_FLAG_KEY);
};
