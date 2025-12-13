document.addEventListener('DOMContentLoaded', function () {
    // Note: auth-guard.js handles the global ajaxSetup and error handling (401).

    // Search Logic
    const searchInput = document.getElementById('inventory-search');
    const searchResults = document.getElementById('search-results');
    const inventoryIdInput = document.getElementById('inventory-id');
    const previewContainer = document.getElementById('item-preview');
    const previewImg = document.getElementById('preview-img');
    const previewName = document.getElementById('preview-name');
    const previewRoom = document.getElementById('preview-room');
    const previewStatus = document.getElementById('preview-status');
    // Use CONFIG for search URL
    const searchUrl = CONFIG.apiUrl('/ajax/inventories/search');

    // Helper: Resolve Image URL (matches inventories.js logic)
    function resolveImageUrl(photoPath) {
        if (!photoPath) return 'images/inventory/default.png';
        if (photoPath.startsWith('http')) return photoPath;

        let path = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
        // Basic heuristic for Laravel storage vs public images
        if (path.includes('storage')) {
            return CONFIG.apiUrl('/' + path); // likely /storage/...
        } else if (path.startsWith('images/')) {
            return CONFIG.apiUrl('/' + path);
        } else {
            // fallback assuming it's in storage if not specified
            return CONFIG.apiUrl('/storage/' + path);
        }
    }

    // 0. Check for inventory_id in URL
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedId = urlParams.get('inventory_id');

    if (preSelectedId) {
        // Fetch inventory details
        const token = localStorage.getItem('auth_token');
        if (token) {
            $.ajax({
                url: CONFIG.apiUrl('/api/inventories/' + preSelectedId),
                method: 'GET', // API route exists: Route::get('/inventories/{inventory}', ...)
                success: function (item) {
                    if (item) {
                        // Map API response to selectItem format
                        // API returns: { id, inventory_name, inventory_photo, status_condition, room: { room_name, ... }, ... }
                        // selectItem expects: { id, name, photo, status, room } (where room is string name)

                        const mappedItem = {
                            id: item.id,
                            name: item.inventory_name,
                            photo: resolveImageUrl(item.inventory_photo),
                            status: item.status_condition,
                            room: item.room ? item.room.room_name : 'Unassigned'
                        };

                        selectItem(mappedItem);
                    }
                },
                error: function (xhr) {
                    console.error('Error fetching pre-selected inventory:', xhr);
                    // Silently fail or show toast? Just let user search manually.
                }
            });
        }
    }

    // AJAX Form Submission
    const addReportForm = document.getElementById('add-report-form');
    if (addReportForm) {
        $(addReportForm).on('submit', function (e) {
            e.preventDefault();

            // 1. Dynamic Token Check (Double Safety - though auth-guard handles request)
            const token = localStorage.getItem('auth_token');
            if (!token) {
                alert('Session Expired. Please log in again.');
                localStorage.removeItem('auth_token');
                window.location.href = 'login.html';
                return;
            }

            const $btn = $(this).find('button[type="submit"]');
            const originalText = $btn.text();
            $btn.prop('disabled', true).text('Submitting...');

            const formData = new FormData(this);

            $.ajax({
                url: CONFIG.apiUrl('/api/reports'), // Use fixed API endpoint
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    alert('Report has been submitted. We will come back to you shortly after we diagnosed the problem');
                    // Always redirect to reports.html (static)
                    window.location.href = 'reports.html';
                },
                error: function (xhr) {
                    $btn.prop('disabled', false).text(originalText);

                    if (xhr.status === 422) {
                        let errors = xhr.responseJSON.errors;
                        let msg = 'Validation Error:\n';
                        for (let field in errors) {
                            msg += `- ${errors[field][0]}\n`;
                        }
                        alert(msg);
                    } else if (xhr.status !== 401) {
                        // 401 is handled globally
                        let msg = 'Failed to submit report.';
                        if (xhr.responseJSON && xhr.responseJSON.message) {
                            msg += ' ' + xhr.responseJSON.message;
                        }
                        alert(msg);
                    }
                }
            });
        });
    }

    // Search Functionality
    let timeout = null;
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(timeout);
            const query = this.value;

            if (query.length < 2) {
                searchResults.style.display = 'none';
                return;
            }

            timeout = setTimeout(() => {
                $.ajax({
                    url: searchUrl,
                    method: 'GET',
                    data: { query: query },
                    success: function (data) {
                        searchResults.innerHTML = '';
                        if (data && data.length > 0) {
                            searchResults.style.display = 'block';
                            data.forEach(item => {
                                const div = document.createElement('div');
                                div.style.padding = '0.75rem';
                                div.style.cursor = 'pointer';
                                div.style.borderBottom = '1px solid #f3f4f6';
                                div.style.display = 'flex';
                                div.style.alignItems = 'center';
                                div.style.gap = '0.75rem';

                                // Status Icon Helper
                                let statusColor = '#10b981'; // green
                                if (item.status === 'NEEDS ATTENTION') statusColor = '#f59e0b'; // yellow
                                if (item.status === 'N.G') statusColor = '#ef4444'; // red

                                div.innerHTML = `
                                    <img src="${item.photo}" style="width:40px; height:40px; border-radius:4px; object-fit:cover;">
                                    <div>
                                        <div style="font-weight:600; font-size:0.9rem;">${item.name}</div>
                                        <div style="font-size:0.8rem; color:#6b7280;">
                                            ${item.room} 
                                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${statusColor}; margin-left:4px;"></span>
                                        </div>
                                    </div>
                                `;

                                div.addEventListener('mouseenter', () => div.style.backgroundColor = '#f9fafb');
                                div.addEventListener('mouseleave', () => div.style.backgroundColor = 'white');
                                div.addEventListener('click', () => {
                                    selectItem(item);
                                });

                                searchResults.appendChild(div);
                            });
                        } else {
                            searchResults.style.display = 'none';
                        }
                    },
                    error: function (xhr) {
                        // 401 handled globally
                        if (xhr.status !== 401) {
                            console.error('Search error:', xhr);
                        }
                    }
                });
            }, 300);
        });
    }

    function selectItem(item) {
        inventoryIdInput.value = item.id;
        searchInput.value = item.name;
        searchResults.style.display = 'none';

        // Show Preview
        previewContainer.style.display = 'flex';
        previewImg.src = item.photo;
        previewName.textContent = item.name;
        previewRoom.textContent = 'Room: ' + item.room;
        previewStatus.textContent = item.status;

        // Update Badge Class
        previewStatus.className = 'card-status';
        if (item.status === 'GOOD') {
            previewStatus.classList.add('status-good');
        } else if (item.status === 'NEEDS ATTENTION') {
            previewStatus.classList.add('status-fair');
        } else {
            previewStatus.classList.add('status-danger');
        }
    }

    // Hide dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (searchInput && searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Evidence Upload Preview

});
