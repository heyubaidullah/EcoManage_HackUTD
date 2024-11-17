// Updated JavaScript (script.js)
const API_BASE_URL = "http://127.0.0.1:5001";

// Fetch and populate buildings for both dropdown and sidebar
function fetchBuildings() {
    console.log("Fetching buildings...");
    fetch(`${API_BASE_URL}/buildings`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            console.log("Response received:", response);
            return response.json();
        })
        .then(data => {
            console.log("Buildings fetched successfully:", data);
            renderBuildingList(data); // Populate sidebar
            populateFilterDropdown(data); // Populate header dropdown
        })
        .catch(error => console.error("Error fetching buildings:", error));
}

// Render buildings in the sidebar
function renderBuildingList(buildings) {
    const buildingList = document.getElementById("building-name");
    const buildingImage = document.getElementById("building-image");

    // Ensure building image and name elements are available before updating
    if (buildingList && buildingImage && buildings.length > 0) {
        // Replace spaces in building name with underscores for image file lookup
        const buildingName = buildings[0].name.replace(/\s+/g, '_');
        buildingList.textContent = buildings[0].name;
        buildingImage.src = `/static/${buildingName}.jpg`;

        // Set up initial building information
        console.log("Building name:", buildings[0].name);
        console.log("Building image path:", buildingImage.src);
    } else {
        console.warn("No building data available or elements not found for updating building image/name.");
    }
}

// Populate the building dropdown for filtering in the header
function populateFilterDropdown(buildings) {
    const filterDropdown = document.getElementById("building-select");
    
    if (filterDropdown) {
        filterDropdown.innerHTML = ""; // Clear previous options
        
        // Add each building to the dropdown as an option
        buildings.forEach(building => {
            const option = document.createElement("option");
            option.value = building.id;
            option.textContent = building.name;
            filterDropdown.appendChild(option);
        });

        // Log dropdown population for debugging purposes
        console.log("Dropdown populated with buildings:", buildings);
    } else {
        console.error("Dropdown element not found to populate buildings.");
    }
}

// Initialize the app by fetching the buildings
fetchBuildings();
