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
    const experiments = localStorage.getItem("experimentsList");
    const bmcData = localStorage.getItem("bmcData");

    // Check if data exists AND contains meaningful content (not empty arrays/objects)
    const hasProjects = projects && projects !== "[]" && JSON.parse(projects).length > 0;
    const hasExperiments = experiments && experiments !== "[]" && JSON.parse(experiments).length > 0;
    const hasBmcData = bmcData && bmcData !== "{}" && Object.keys(JSON.parse(bmcData)).length > 0;

    return !!(hasProjects || hasExperiments || hasBmcData);
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

// Import localStorage data from static JSON file
export const importLocalStorage = async (): Promise<boolean> => {
  try {
    const response = await fetch("/localStorage_backup.json");

    if (!response.ok) {
      console.error("localStorage_backup.json not found or not accessible");
      return false;
    }

    const data: LocalStorageData = await response.json();

    // Import all data
    for (const key in data) {
      localStorage.setItem(key, data[key]);
    }

    // Set import flag
    localStorage.setItem(IMPORT_FLAG_KEY, "true");

    console.log(
      "localStorage imported successfully from localStorage_backup.json"
    );
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
      window.location.reload();
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
