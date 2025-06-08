// Main data
let data = [];
let filteredData = [];
let selectedId = null;
const VERSION = "0.4.3";

// Display list of entries
function renderEntries() {
  const container = document.getElementById("entriesList");
  container.innerHTML = "";

  filteredData.forEach((entry) => {
    const entryElement = document.createElement("div");
    entryElement.className = `entry-item ${
      selectedId === entry.id ? "selected" : ""
    }`;
    entryElement.onclick = () => selectEntry(entry.id);

    entryElement.innerHTML = `
            <div class="entry-name">${entry.name}</div>
            <div class="entry-details">
                ${entry.category} | ${entry.cnc} | ${
      entry.type === "milling" ? "Mill" : "Turn"
    } | ${entry.license}
            </div>
            <div class="entry-details">${entry.desc_en || ""}</div>
        `;

    container.appendChild(entryElement);
  });

  // Hide/show list
  const entriesList = document.getElementById("entriesList");
  if (filteredData.length === 0) {
    entriesList.style.display = "none";
  } else {
    entriesList.style.display = "";
  }
}

// Select an entry
function selectEntry(id) {
  selectedId = id;
  const entry = data.find((item) => item.id === id);

  if (entry) {
    document.getElementById("edit-category").value = entry.category;
    document.getElementById("edit-cnc").value = entry.cnc;
    document.getElementById("edit-name").value = entry.name;
    document.getElementById("edit-type").value = entry.type;
    document.getElementById("edit-license").value = entry.license;
    document.getElementById("edit-desc_en").value = entry.desc_en;
    document.getElementById("edit-desc_ru").value = entry.desc_ru;
    document.getElementById("edit-zip_url").value = entry.zip_url;
  }

  renderEntries();
}

// Filter data
function filterData() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  filteredData = data.filter(
    (entry) =>
      entry.name.toLowerCase().includes(searchTerm) ||
      (entry.desc_ru && entry.desc_ru.toLowerCase().includes(searchTerm)) ||
      (entry.desc_en && entry.desc_en.toLowerCase().includes(searchTerm))
  );
  renderEntries();
}

// Validates the entry form and shows errors if fields are invalid.
function validateEntryForm() {
  const name = document.getElementById("edit-name").value.trim();
  const zipUrl = document.getElementById("edit-zip_url").value.trim();
  let isValid = true;

  // Clear previous errors
  document.querySelectorAll(".error-message").forEach(el => el.remove());
  document.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));

  // Validate Name (required)
  if (!name) {
    showFieldError("edit-name", 'The "Name" field is required');
    isValid = false;
  }

  // Validate ZIP URL (if provided)
  if (zipUrl && !isValidUrl(zipUrl)) {
    showFieldError("edit-zip_url", 'ZIP URL must start with http:// or https://');
    isValid = false;
  }

  return isValid;
}

// Shows an error under a specific field
function showFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  input.classList.add("invalid");

  const errorElement = document.createElement("div");
  errorElement.className = "error-message";
  errorElement.textContent = message;
  input.parentNode.appendChild(errorElement);
}

// Checks if a URL is valid
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Add a new entry
function addNewEntry() {
  // Validate before processing
  if (!validateEntryForm()) return;

  // Generate a safe ID (handles empty data case)
  const newId = data.length > 0 
    ? Math.max(...data.map(item => parseInt(item.id) || 0)) + 1 
    : 1;

  // Get config safely (fallback if `config` is undefined)
  const baseUrl = (config?.BASE_URL || "").trim();
  const channelId = (config?.TELEGRAM_CHANNEL_ID || "").trim();
  const defaultZipUrl = `${baseUrl}${channelId}/`;

  // Collect and trim all form values
  const formFields = {
    category: document.getElementById("edit-category").value.trim() || "NX",
    cnc: document.getElementById("edit-cnc").value.trim() || "Fanuc",
    name: document.getElementById("edit-name").value.trim(),
    type: document.getElementById("edit-type").value.trim() || "milling",
    license: document.getElementById("edit-license").value.trim() || "free",
    desc_en: document.getElementById("edit-desc_en").value.trim(),
    desc_ru: document.getElementById("edit-desc_ru").value.trim(),
    zip_url: document.getElementById("edit-zip_url").value.trim() || defaultZipUrl,
  };

  // Validate ZIP URL (if manually provided)
  if (formFields.zip_url !== defaultZipUrl && !isValidUrl(formFields.zip_url)) {
    showFieldError("edit-zip_url", "Invalid URL. Must start with http:// or https://");
    return;
  }

  // Create and save the new entry
  const newEntry = { id: newId.toString(), ...formFields };
  data.push(newEntry);
  filteredData.push(newEntry);
  selectedId = newId.toString();

  // Update UI and storage
  selectEntry(selectedId);
  document.getElementById("search").value = "";
  filterData();
  saveToLocalStorage();

  showToast("New entry added!");
}

// Save changes
function saveChanges() {
  if (!selectedId) {
    showToast("No entry selected!");
    return;
  }

  // Validate before saving
  if (!validateEntryForm()) return;

  const entry = data.find(item => item.id === selectedId);
  if (!entry) {
    showToast("Entry not found!");
    return;
  }

  // Update entry data (with trimming)
  entry.category = document.getElementById("edit-category").value.trim();
  entry.cnc = document.getElementById("edit-cnc").value.trim();
  entry.name = document.getElementById("edit-name").value.trim();
  entry.type = document.getElementById("edit-type").value.trim();
  entry.license = document.getElementById("edit-license").value.trim();
  entry.desc_en = document.getElementById("edit-desc_en").value.trim();
  entry.desc_ru = document.getElementById("edit-desc_ru").value.trim();
  
  // Validate ZIP URL before saving
  const newZipUrl = document.getElementById("edit-zip_url").value.trim();
  if (newZipUrl && !isValidUrl(newZipUrl)) {
    showFieldError("edit-zip_url", "Invalid URL format");
    return;
  }
  entry.zip_url = newZipUrl;

  // Update UI and storage
  renderEntries();
  saveToLocalStorage();
  showToast("Changes saved!");
}

// Shows a non-blocking notification
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Delete selected entry
function deleteEntry() {
  if (!selectedId || !confirm("Delete the selected entry?")) return;

  data = data.filter((item) => item.id !== selectedId);
  filteredData = filteredData.filter((item) => item.id !== selectedId);
  selectedId = null;

  clearForm();
  renderEntries();
  saveToLocalStorage();
}

// Clear form
function clearForm() {
  const baseUrl = typeof config !== "undefined" ? config.BASE_URL || "" : "";
  const channelId =
    typeof config !== "undefined" ? config.TELEGRAM_CHANNEL_ID || "" : "";

  document.getElementById("edit-name").value = "";
  document.getElementById("edit-desc_en").value = "";
  document.getElementById("edit-desc_ru").value = "";
  document.getElementById("edit-zip_url").value = `${baseUrl}${channelId}/`;
  document.getElementById("edit-category").value = "NX";
  document.getElementById("edit-cnc").value = "Fanuc";
  document.getElementById("edit-type").value = "milling";
  document.getElementById("edit-license").value = "free";
  document.getElementById("search").value = "";
  selectedId = null;
  renderEntries();
}

// Clear all data
function clearAll() {
  if (!confirm("Clear all data?")) return;
  data = [];
  filteredData = [];
  localStorage.removeItem("postprocessors_data");
  clearForm();
}

// Load data from file
function loadData() {
  document.getElementById("fileInput").click();
}

// Save data to file
function saveData() {
  if (data.length === 0) {
    showToast("No data to save");
    return;
  }

  const jsonData = {
    post_processors: data,
  };

  const json = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "posts_updated.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  saveToLocalStorage();
  showToast("Data saved as posts_updated.json");
}

// Show statistics of post-processors
function showStats() {
  try {
    if (!data || data.length === 0) {
      showToast("No post-processors in database");
      return;
    }

		// Initialize counters
		const stats = {
			total: data.length,
			nx_mill: 0,
			nx_turn: 0,
			nx_router: 0,
			nx_cutting: 0,
			nx_additive: 0,
			nx_setup_sheet: 0,
			fusion_mill: 0,
			fusion_turn: 0,
			fusion_router: 0,
			fusion_cutting: 0,
			fusion_additive: 0,
			fusion_setup_sheet: 0,
			free: 0,
			paid: 0,
		};

		// Count statistics
		data.forEach((post) => {
			const category = (post.category || "").toLowerCase().trim();
			const postType = (post.type || "").toLowerCase().trim();
			const license = (post.license || "").toLowerCase().trim();

			// Count by license
			if (license === "free") stats.free++;
			else if (license === "paid") stats.paid++;

			// Count by category and type
			if (category.includes("nx")) {
				if (postType.includes("mill")) stats.nx_mill++;
				else if (postType.includes("turn")) stats.nx_turn++;
				else if (postType.includes("router")) stats.nx_router++;
				else if (postType.includes("cutting")) stats.nx_cutting++;
				else if (postType.includes("additive")) stats.nx_additive++;
				else if (postType.includes("document")) stats.nx_setup_sheet++;
			} else if (category.includes("fusion")) {
				if (postType.includes("mill")) stats.fusion_mill++;
				else if (postType.includes("turn")) stats.fusion_turn++;
				else if (postType.includes("router")) stats.fusion_router++;
				else if (postType.includes("cutting")) stats.fusion_cutting++;
				else if (postType.includes("additive")) stats.fusion_additive++;
				else if (postType.includes("document")) stats.fusion_setup_sheet++;
			}
		});

		// Format the HTML content
		const statsContent = `
			<h3 style="text-align: center;">Post-processors Statistics</h3>
			<div style="text-align: left; margin-left: 20px;">
				<p>Total: <strong>${stats.total}</strong></p>
				<br>
				<h4>By Category and Type</h4>
				<p>NX Milling: <strong>${stats.nx_mill}</strong></p>
				<p>NX Turning: <strong>${stats.nx_turn}</strong></p>
				<p>NX Router: <strong>${stats.nx_router}</strong></p>
				<p>NX Cutting: <strong>${stats.nx_cutting}</strong></p>
				<p>NX Additive: <strong>${stats.nx_additive}</strong></p>
				<p>NX Setup Sheet: <strong>${stats.nx_setup_sheet}</strong></p>
				<p>Fusion 360 Milling: <strong>${stats.fusion_mill}</strong></p>
				<p>Fusion 360 Turning: <strong>${stats.fusion_turn}</strong></p>
				<p>Fusion 360 Router: <strong>${stats.fusion_router}</strong></p>
				<p>Fusion 360 Cutting: <strong>${stats.fusion_cutting}</strong></p>
				<p>Fusion 360 Additive: <strong>${stats.fusion_additive}</strong></p>
				<p>Fusion 360 Setup Sheet: <strong>${stats.fusion_setup_sheet}</strong></p>
				<br>
				<h4>By License</h4>
				<p>Free: <strong>${stats.free}</strong></p>
				<p>Paid: <strong>${stats.paid}</strong></p>
				<br>
				<div style="text-align: center;">
					<button onclick="document.getElementById('statsModal').classList.remove('active')">Close</button>
				</div>
			</div>
		`;

		// Update or create modal
		let modal = document.getElementById("statsModal");
		if (!modal) {
			modal = document.createElement("div");
			modal.id = "statsModal";
			modal.className = "modal";
			modal.innerHTML = `<div class="modal-content">${statsContent}</div>`;
			document.body.appendChild(modal);
		} else {
			modal.querySelector(".modal-content").innerHTML = statsContent;
		}

    // Show modal
    modal.classList.add("active");
  } catch (error) {
    console.error("Failed to show stats:", error);
    showToast("Error loading statistics");
  }
}

// Menu functions
function toggleMenu() {
  const menu = document.getElementById("sideMenu");
  const overlay = document.getElementById("overlay");
  menu.classList.toggle("active");
  overlay.classList.toggle("active");
}

// About modal functions
function showAbout() {
  document.getElementById("aboutModal").classList.add("active");
  toggleMenu();
}

// Close about modal
function closeAbout() {
  document.getElementById("aboutModal").classList.remove("active");
}

// Dark mode toggle
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode !== null) {
  config.DARK_MODE = savedDarkMode === 'true';
  
  if (config.DARK_MODE) {
    document.body.classList.add("dark-theme");
  }
}

// Toggle dark mode
function toggleDarkMode() {
  const isDarkMode = document.body.classList.toggle("dark-theme");
  config.DARK_MODE = isDarkMode;
  localStorage.setItem('darkMode', isDarkMode);

  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.checked = isDarkMode;
  }
}

// Load data from local storage
function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem("postprocessors_data");
    if (stored) {
      data = JSON.parse(stored);
      filteredData = [...data];
    }
  } catch (e) {
    console.error("Error loading data from localStorage:", e);
    data = [];
    filteredData = [];
  }
}

// Save data to local storage
function saveToLocalStorage() {
  try {
    localStorage.setItem("postprocessors_data", JSON.stringify(data));
  } catch (e) {
    console.error("Error saving data to localStorage:", e);
  }
}

// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
  loadFromLocalStorage();
  renderEntries();
  clearForm();

  const elems = document.querySelectorAll(".version-info");
  elems.forEach((el) => {
    el.textContent = `Version: v${VERSION}`;
  });

  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.checked = config.DARK_MODE;
  }
});

// Handle file selection when the user chooses a file
document.getElementById("fileInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onerror = function () {
    showToast("Error reading file: " + reader.error.message);
    console.error("FileReader error:", reader.error);
    e.target.value = "";
  };

  reader.onload = function (e) {
    try {
      const json = JSON.parse(e.target.result);
      data = json.post_processors || [];
      filteredData = [...data];
      saveToLocalStorage();
      renderEntries();
      showToast(`Successfully uploaded ${data.length} entries`);
    } catch (error) {
      showToast("Error reading file: " + error.message);
      console.error(error);
    }

    e.target.value = "";
  };

  reader.readAsText(file);
});

// Service Worker registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.log("Error registration Service Worker:", error);
      });
  });
}
