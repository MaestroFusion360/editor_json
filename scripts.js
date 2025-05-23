// Main data
let data = [];
let filteredData = [];
let selectedId = null;
const VERSION = '0.3.2';

// Display list of entries
function renderEntries() {
    const container = document.getElementById('entriesList');
    container.innerHTML = '';
    
    filteredData.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = `entry-item ${selectedId === entry.id ? 'selected' : ''}`;
        entryElement.onclick = () => selectEntry(entry.id);
        
        entryElement.innerHTML = `
            <div class="entry-name">${entry.name}</div>
            <div class="entry-details">
                ${entry.category} | ${entry.cnc} | ${entry.type === 'milling' ? 'Mill' : 'Turn'} | ${entry.license}
            </div>
            <div class="entry-details">${entry.desc_en || ''}</div>
        `;
        
        container.appendChild(entryElement);
    });

    // Hide/show list
    const entriesList = document.getElementById('entriesList');
    if (filteredData.length === 0) {
        entriesList.style.display = 'none';
    } else {
        entriesList.style.display = '';
    }
}

// Select an entry
function selectEntry(id) {
    selectedId = id;
    const entry = data.find(item => item.id === id);
    
    if (entry) {
        document.getElementById('edit-category').value = entry.category;
        document.getElementById('edit-cnc').value = entry.cnc;
        document.getElementById('edit-name').value = entry.name;
        document.getElementById('edit-type').value = entry.type;
        document.getElementById('edit-license').value = entry.license;
        document.getElementById('edit-desc_en').value = entry.desc_en;
        document.getElementById('edit-desc_ru').value = entry.desc_ru;
        document.getElementById('edit-zip_url').value = entry.zip_url;
    }
    
    renderEntries();
}

// Filter data
function filterData() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    filteredData = data.filter(entry => 
        entry.name.toLowerCase().includes(searchTerm) ||
        (entry.desc_ru && entry.desc_ru.toLowerCase().includes(searchTerm)) ||
        (entry.desc_en && entry.desc_en.toLowerCase().includes(searchTerm))
    );
    renderEntries();
}

// Add a new entry
function addNewEntry() {
    const newId = data.length > 0 
        ? Math.max(...data.map(item => parseInt(item.id))) + 1 
        : 1;
    
    const baseUrl = typeof config !== 'undefined' ? config.BASE_URL || '' : '';
    const channelId = typeof config !== 'undefined' ? config.TELEGRAM_CHANNEL_ID || '' : '';
    
    // Get all form values
    const formFields = {
        category: document.getElementById('edit-category').value,
        cnc: document.getElementById('edit-cnc').value,
        name: document.getElementById('edit-name').value.trim(),
        type: document.getElementById('edit-type').value,
        license: document.getElementById('edit-license').value,
        desc_en: document.getElementById('edit-desc_en').value.trim(),
        desc_ru: document.getElementById('edit-desc_ru').value.trim(),
        zip_url: document.getElementById('edit-zip_url').value.trim()
    };
    
    // Create new entry with fallback values
    const newEntry = {
        id: newId.toString(),
        category: formFields.category || 'NX',
        cnc: formFields.cnc || 'Fanuc',
        name: formFields.name || "New post-processor",
        type: formFields.type || 'milling',
        license: formFields.license || 'free',
        desc_en: formFields.desc_en || "",
        desc_ru: formFields.desc_ru || "",
        zip_url: formFields.zip_url || `${baseUrl}${channelId}/`
    };
    
    // Add to data arrays
    data.push(newEntry);
    filteredData.push(newEntry);
    selectedId = newId.toString();
    
    // Update UI
    selectEntry(newId.toString());
    document.getElementById('search').value = '';
    filterData();
    saveToLocalStorage();
}

// Save changes
function saveChanges() {
    if (!selectedId) return;
    
    const name = document.getElementById('edit-name').value;
    if (!name || name.trim() === '') {
        alert('The "Name" field is required');
        return;
    }
    
    const entry = data.find(item => item.id === selectedId);
    if (entry) {
        entry.category = document.getElementById('edit-category').value;
        entry.cnc = document.getElementById('edit-cnc').value;
        entry.name = name;
        entry.type = document.getElementById('edit-type').value;
        entry.license = document.getElementById('edit-license').value;
        entry.desc_en = document.getElementById('edit-desc_en').value;
        entry.desc_ru = document.getElementById('edit-desc_ru').value;
        entry.zip_url = document.getElementById('edit-zip_url').value;
        
        renderEntries();
        saveToLocalStorage();
        alert('Changes saved!');
    }

}

// Delete selected entry
function deleteEntry() {
    if (!selectedId || !confirm('Delete the selected entry?')) return;
    
    data = data.filter(item => item.id !== selectedId);
    filteredData = filteredData.filter(item => item.id !== selectedId);
    selectedId = null;
    
    clearForm();
    renderEntries();
    saveToLocalStorage();
}

// Clear form
function clearForm() {
    const baseUrl = typeof config !== 'undefined' ? config.BASE_URL || '' : '';
    const channelId = typeof config !== 'undefined' ? config.TELEGRAM_CHANNEL_ID || '' : '';
    
    document.getElementById('edit-name').value = '';
    document.getElementById('edit-desc_en').value = '';
    document.getElementById('edit-desc_ru').value = '';
    document.getElementById('edit-zip_url').value = `${baseUrl}${channelId}/`;
    document.getElementById('edit-category').value = 'NX';
    document.getElementById('edit-cnc').value = 'Fanuc';
    document.getElementById('edit-type').value = 'milling';
    document.getElementById('edit-license').value = 'free';
    document.getElementById('search').value = '';
    selectedId = null;
    renderEntries();
}

// Clear all data
function clearAll() {
    if (!confirm('Clear all data?')) return;
    data = [];
    filteredData = [];
    localStorage.removeItem('postprocessors_data');
    clearForm();
}

// Load data from file
function loadData() {
    document.getElementById('fileInput').click();
}

// Save data to file
function saveData() {
    if (data.length === 0) {
        alert('No data to save');
        return;
    }

    const jsonData = {
        post_processors: data
    };

    const json = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts_updated.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    saveToLocalStorage()
    alert('Data saved as posts_updated.json');
}

// Show statistics of post-processors
function showStats() {
    if (data.length === 0) {
        alert('No post-processors in database');
        return;
    }

    // Initialize counters
    const stats = {
        total: data.length,
        nx_mill: 0,
        nx_turn: 0,
        fusion_mill: 0,
        fusion_turn: 0,
        other: 0,
        free: 0,
        paid: 0
    };

    // Count statistics
    data.forEach(post => {
        const category = (post.category || '').toLowerCase();
        const postType = (post.type || '').toLowerCase();
        const license = (post.license || '').toLowerCase();

        // Count by license
        if (license === 'free') stats.free++;
        else if (license === 'paid') stats.paid++;

        // Count by category and type
        if (category === 'nx') {
            if (postType === 'milling') stats.nx_mill++;
            else if (postType === 'turning') stats.nx_turn++;
        } else if (category === 'fusion360') {
            if (postType === 'milling') stats.fusion_mill++;
            else if (postType === 'turning') stats.fusion_turn++;
        } else {
            stats.other++;
        }
    });

    // Format the HTML content to match your aboutModal style
    const statsContent = `
        <h3 style="text-align: center;">Post-processors Statistics</h3>
        <div style="text-align: left; margin-left: 20px;">
            <p>Total: <strong>${stats.total}</strong></p>
            <br>
            <h4>By Category</h4>
            <p>NX Milling: <strong>${stats.nx_mill}</strong></p>
            <p>NX Turning: <strong>${stats.nx_turn}</strong></p>
            <p>Fusion 360 Milling: <strong>${stats.fusion_mill}</strong></p>
            <p>Fusion 360 Turning: <strong>${stats.fusion_turn}</strong></p>
            <p>Other: <strong>${stats.other}</strong></p>
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

    // Get or create modal
    let modal = document.getElementById('statsModal');
    if (!modal) {
        // Create modal if it doesn't exist
        modal = document.createElement('div');
        modal.id = 'statsModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content">${statsContent}</div>`;
        document.body.appendChild(modal);
    } else {
        // Update existing modal content
        modal.querySelector('.modal-content').innerHTML = statsContent;
    }
    
    // Show modal
    modal.classList.add('active');
}

// Menu functions
function toggleMenu() {
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('overlay');
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
}

// About modal functions
function showAbout() {
  document.getElementById('aboutModal').classList.add('active');
  toggleMenu();
}

// Close about modal
function closeAbout() {
  document.getElementById('aboutModal').classList.remove('active');
}

// Dark mode toggle
function toggleDarkMode() {
  document.body.classList.toggle('dark-theme');
}

// Load data from local storage
function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('postprocessors_data');
        if (stored) {
            data = JSON.parse(stored);
            filteredData = [...data];
        }
    } catch (e) {
        console.error('Error loading data from localStorage:', e);
        data = [];
        filteredData = [];
    }
}

// Save data to local storage
function saveToLocalStorage() {
    try {
        localStorage.setItem('postprocessors_data', JSON.stringify(data));
    } catch (e) {
        console.error('Error saving data to localStorage:', e);
    }
}

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    renderEntries();
    clearForm();

    const elems = document.querySelectorAll('.version-info');
    elems.forEach(el => {
        el.textContent = `Version: v${VERSION}`;
    });
});

// Handle file selection when the user chooses a file
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onerror = function() {
        alert('Error reading file: ' + reader.error.message);
        console.error('FileReader error:', reader.error);
        e.target.value = '';
    };
    
    reader.onload = function(e) {
        try {
            const json = JSON.parse(e.target.result);
            data = json.post_processors || [];
            filteredData = [...data];
            saveToLocalStorage();
            renderEntries();
            alert(`Successfully uploaded ${data.length} entries`);
        } catch (error) {
            alert('Error reading file: ' + error.message);
            console.error(error);
        }

        e.target.value = '';
    };
    
    reader.readAsText(file);
});


// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').then(registration => {
            console.log('Service Worker registered:', registration.scope);
        }).catch(error => {
            console.log('Error registration Service Worker:', error);
        });
    });
}