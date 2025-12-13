document.addEventListener('DOMContentLoaded', function () {
    // Note: auth-guard.js handles global 401 checks on load and via ajax requests.

    const submittedContainer = document.getElementById('submitted-reports-container');
    const receivedContainer = document.getElementById('received-reports-container');
    const submittedSection = document.getElementById('submitted-reports-section');
    const receivedSection = document.getElementById('received-reports-section');
    const submittedCountEl = document.getElementById('submitted-count');
    const receivedCountEl = document.getElementById('received-count');

    // Selection Mode State
    let selectedReportIds = new Set();
    const btnDeleteText = document.getElementById('btn-delete-text');

    // Initial Fetch
    fetchReportsData();

    function fetchReportsData() {
        $.ajax({
            url: CONFIG.apiUrl('/api/reports/data'),
            method: 'GET',
            success: function (data) {
                renderReports(data);
            },
            error: function (xhr) {
                // 401 handled globally by auth-guard
                if (xhr.status !== 401) {
                    console.error('Error loading reports:', xhr);
                }
            }
        });
    }

    function renderReports(data) {
        const { submittedReports, receivedReports, currentUser } = data;

        // Submitted Reports
        const submittedTbody = document.getElementById('submitted-table-body');
        const submittedEmpty = document.getElementById('submitted-empty-state');
        const submittedCountEl = document.getElementById('submitted-count');

        submittedCountEl.textContent = submittedReports ? submittedReports.length : 0;
        submittedTbody.innerHTML = '';

        if (submittedReports && submittedReports.length > 0) {
            submittedEmpty.style.display = 'none';
            submittedReports.forEach(report => {
                submittedTbody.appendChild(createReportRow(report, currentUser, true));
            });
        } else {
            submittedEmpty.style.display = 'block';
        }

        // Received Reports
        const receivedTbody = document.getElementById('received-table-body');
        const receivedEmpty = document.getElementById('received-empty-state');
        const receivedCountEl = document.getElementById('received-count');

        receivedCountEl.textContent = receivedReports ? receivedReports.length : 0;
        receivedTbody.innerHTML = '';

        if (receivedReports && receivedReports.length > 0) {
            receivedEmpty.style.display = 'none';
            receivedReports.forEach(report => {
                receivedTbody.appendChild(createReportRow(report, currentUser, false));
            });
        } else {
            receivedEmpty.style.display = 'block';
        }
    }

    function createReportRow(report, currentUser, isSubmitted) {
        const tr = document.createElement('tr');
        tr.dataset.id = report.id;

        // Store Full Object for Modal functionality
        tr.reportData = report;

        const photoUrl = report.evidence_photo ? `/${report.evidence_photo}` : null;
        const inventoryName = report.inventory ? report.inventory.inventory_name : 'Deleted Inventory';
        const roomName = (report.inventory && report.inventory.room) ? report.inventory.room.room_name : 'Unknown Room';
        const dateStr = new Date(report.date_reported).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Image Cell
        let imageHtml = '';
        if (photoUrl) {
            const fullPhotoUrl = photoUrl.startsWith('http') ? photoUrl : CONFIG.apiUrl(photoUrl);
            imageHtml = `<img src="${fullPhotoUrl}" alt="Img" class="report-table-img">`;
        } else {
            imageHtml = `<span class="no-image-text">-</span>`;
        }

        // Status Badge Logic
        let statusClass = 'status-good';
        let statusText = report.status_condition || 'Unknown';
        if (statusText === 'NEEDS ATTENTION') statusClass = 'status-fair';
        if (statusText === 'N.G') statusClass = 'status-danger';

        tr.innerHTML = `
            <td>
                <div class="td-checkbox-wrapper" onclick="event.stopPropagation()">
                    <input type="checkbox" class="report-checkbox" value="${report.id}">
                </div>
            </td>
            <td>#${report.id}</td>
            <td>${imageHtml}</td>
            <td class="font-medium">${inventoryName}</td>
            <td>${roomName}</td>
            <td class="text-truncate" style="max-width: 200px;" title="${report.remarks}">${report.remarks}</td>
            <td><span class="report-status-badge ${statusClass}">${statusText}</span></td>
            <td>${dateStr}</td>
        `;

        // Click row to open modal (except when clicking checkbox)
        tr.addEventListener('click', function (e) {
            // Check if click was on checkbox or its wrapper
            if (!e.target.closest('.report-checkbox') && !e.target.closest('.td-checkbox-wrapper')) {
                openReportModal(report.id);
            }
        });

        return tr;
    }

    // --------------------------------------------------------------------------
    // Bulk Selection Logic
    // --------------------------------------------------------------------------
    const btnDeleteSelected = document.getElementById('btn-delete-selected');
    const selectedCountSpan = document.getElementById('selected-count');

    // Select All Checkboxes
    const selectAllSubmitted = document.getElementById('select-all-submitted');
    const selectAllReceived = document.getElementById('select-all-received');

    if (selectAllSubmitted) {
        selectAllSubmitted.addEventListener('change', function () {
            const isChecked = this.checked;
            // Only select visible checkboxes in submitted table
            const checkboxes = document.querySelectorAll('#submitted-table-body .report-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
                const id = parseInt(cb.value);
                if (isChecked) selectedReportIds.add(id);
                else selectedReportIds.delete(id);
            });
            updateDeleteButton();
        });
    }

    if (selectAllReceived) {
        selectAllReceived.addEventListener('change', function () {
            const isChecked = this.checked;
            // Only select visible checkboxes in received table
            const checkboxes = document.querySelectorAll('#received-table-body .report-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = isChecked;
                const id = parseInt(cb.value);
                if (isChecked) selectedReportIds.add(id);
                else selectedReportIds.delete(id);
            });
            updateDeleteButton();
        });
    }

    // 1. Update Button Visibility
    function updateDeleteButton() {
        selectedCountSpan.textContent = selectedReportIds.size;

        if (selectedReportIds.size > 0) {
            btnDeleteSelected.style.display = 'inline-flex';
        } else {
            btnDeleteSelected.style.display = 'none';
        }
    }

    // 2. Trigger Delete
    btnDeleteSelected.addEventListener('click', function () {
        if (confirm(`Delete ${selectedReportIds.size} selected reports?`)) {
            performBulkDelete();
        }
    });

    // Delegated Checkbox Click
    $(document).on('change', '.report-checkbox', function (e) {
        const id = parseInt(this.value);
        if (this.checked) selectedReportIds.add(id);
        else selectedReportIds.delete(id);

        updateDeleteButton();
    });

    // Prevent modal opening when clicking checkbox wrapper
    $(document).on('click', '.card-checkbox-wrapper', function (e) {
        e.stopPropagation();
    });

    function performBulkDelete() {
        // Redundant token check removed - rely on auth-guard or backend 401
        const idsArray = Array.from(selectedReportIds);
        $.ajax({
            url: CONFIG.apiUrl('/api/reports/bulk-delete'),
            method: 'DELETE',
            data: { ids: idsArray },
            success: function (res) {
                alert('Report has been deleted.');
                fetchReportsData();
                exitSelectionMode();
            },
            error: function (xhr) {
                // 401 handled globally
                if (xhr.status !== 401) {
                    alert('Bulk delete failed: ' + (xhr.responseJSON?.message || 'Unknown error'));
                }
            }
        });
    }

    function exitSelectionMode() {
        // Clear selection
        selectedReportIds.clear();
        updateDeleteButton();
        document.querySelectorAll('.report-checkbox').forEach(cb => cb.checked = false);
    }

    // --------------------------------------------------------------------------
    // Modal Logic
    // --------------------------------------------------------------------------
    const modal = document.getElementById('report-modal');
    const modalView = document.getElementById('modal-view-mode');
    const modalEdit = document.getElementById('modal-edit-form');

    // Elements
    const mInventory = document.getElementById('modal-inventory-name');
    const mRemarks = document.getElementById('modal-remarks');
    const mStatus = document.getElementById('modal-status');
    const mDate = document.getElementById('modal-date');
    const mImg = document.getElementById('modal-img');
    const mActions = document.getElementById('modal-actions-submitted');

    // Edit Form Elements
    const eInventory = document.getElementById('edit-inventory-name');
    const eRemarks = document.getElementById('edit-remarks');
    let currentReportId = null;

    const btnDelete = document.getElementById('btn-delete-report');
    if (btnDelete) {
        btnDelete.addEventListener('click', function () {
            window.confirmDelete();
        });
    }

    window.openReportModal = function (reportId) {
        // Find report data
        const row = document.querySelector(`tr[data-id="${reportId}"]`);
        if (!row || !row.reportData) return;
        const r = row.reportData;
        currentReportId = r.id;

        // Populate View
        mInventory.textContent = r.inventory ? r.inventory.inventory_name : 'Deleted';
        mRemarks.textContent = r.remarks;
        mStatus.textContent = r.status_condition;
        mDate.textContent = new Date(r.date_reported).toLocaleDateString();

        if (r.evidence_photo) {
            mImg.src = `/${r.evidence_photo}`;
            mImg.style.display = 'block';
        } else {
            mImg.style.display = 'none';
        }

        // Show Actions (Delete) for EVERYONE
        // Backend handles logic: Owner -> Hard Delete, Receiver -> Soft Delete (Hide)
        mActions.style.display = 'flex';

        modal.classList.add('show');
        modalView.style.display = 'block';
        modalEdit.style.display = 'none';
    };

    window.closeReportModal = function () {
        modal.classList.remove('show');
    };

    // Close on overlay click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeReportModal();
    });
    document.getElementById('modal-close-btn').addEventListener('click', closeReportModal);

    // Delete Single
    window.confirmDelete = function () {
        if (!confirm('Delete this report?')) return;

        $.ajax({
            url: CONFIG.apiUrl(`/api/reports/${currentReportId}`),
            method: 'DELETE',
            success: function (res) {
                alert('Report has been deleted.');
                closeReportModal();
                fetchReportsData();
            },
            error: function (xhr) {
                // 401 handled globally
                if (xhr.status !== 401) {
                    alert('Delete failed: ' + (xhr.responseJSON?.message || 'Unknown error'));
                }
            }
        });
    };

    // Store currentUser globally for logic
    const originalRender = renderReports;
    renderReports = function (data) {
        window.currentUser = data.currentUser;
        originalRender(data);
    };

    // Accordion Toggle Logic (Global for inline onclick)
    window.toggleSection = function (containerId, headerEl) {
        const container = document.getElementById(containerId);
        const icon = headerEl.querySelector('.chevron-icon');

        if (container.style.display === 'none') {
            container.style.display = 'grid';
            if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
            container.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(-90deg)';
        }
    };

});
