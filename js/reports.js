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
            url: '/api/reports/data',
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
        const submittedSection = document.getElementById('submitted-reports-section');
        const submittedContainer = document.getElementById('submitted-reports-container');
        const submittedCountEl = document.getElementById('submitted-count');

        submittedCountEl.textContent = submittedReports ? submittedReports.length : 0;
        submittedContainer.innerHTML = '';

        if (submittedReports && submittedReports.length > 0) {
            submittedReports.forEach(report => {
                submittedContainer.appendChild(createReportCard(report, currentUser, true));
            });
        } else {
            submittedContainer.innerHTML = '<p class="empty-state" style="color: #6b7280; font-style: italic; padding: 1rem;">No reports submitted yet.</p>';
        }

        // Received Reports
        const receivedSection = document.getElementById('received-reports-section');
        const receivedContainer = document.getElementById('received-reports-container');
        const receivedCountEl = document.getElementById('received-count');

        receivedCountEl.textContent = receivedReports ? receivedReports.length : 0;
        receivedContainer.innerHTML = '';

        if (receivedReports && receivedReports.length > 0) {
            receivedReports.forEach(report => {
                receivedContainer.appendChild(createReportCard(report, currentUser, false));
            });
        } else {
            receivedContainer.innerHTML = '<p class="empty-state" style="color: #6b7280; font-style: italic; padding: 1rem;">No reports available.</p>';
        }
    }

    function createReportCard(report, currentUser, isSubmitted) {
        const card = document.createElement('div');
        card.className = 'report-card';
        card.dataset.id = report.id;

        const photoUrl = report.evidence_photo ? `/${report.evidence_photo}` : null;
        const inventoryName = report.inventory ? report.inventory.inventory_name : 'Deleted Inventory';
        const roomName = (report.inventory && report.inventory.room) ? report.inventory.room.room_name : 'Unknown Room';
        const dateStr = new Date(report.date_reported).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        // Checkbox (Always Visible)
        const checkboxHtml = `
            <div class="card-checkbox-wrapper">
                <input type="checkbox" class="report-checkbox" value="${report.id}">
            </div>
        `;

        // Image Section
        let imageHtml = '';
        if (photoUrl) {
            imageHtml = `<img src="${photoUrl}" alt="Evidence" class="report-img">`;
        } else {
            imageHtml = `<div class="no-image-placeholder">No Image</div>`;
        }

        // Status Badge Logic
        let statusClass = 'status-good';
        let statusText = report.status_condition || 'Unknown';
        if (statusText === 'NEEDS ATTENTION') statusClass = 'status-fair';
        if (statusText === 'N.G') statusClass = 'status-danger';

        card.innerHTML = `
            ${checkboxHtml}
            
            <div class="report-card-body" onclick="openReportModal('${report.id}')">
                <div class="report-card-image-wrapper">
                    ${imageHtml}
                </div>

                <div class="report-card-content">
                    <div class="report-header">
                         <div class="report-meta-top">
                            <span class="report-id">#${report.id}</span>
                            <span class="report-date">${dateStr}</span>
                        </div>
                        <h4 class="report-inv-name">${inventoryName}</h4>
                        <span class="report-room">${roomName}</span>
                    </div>
                    
                    <div class="report-body-preview">
                        <span class="report-remarks">"${report.remarks}"</span>
                    </div>

                    <div class="report-footer">
                        <span class="report-status ${statusClass}">${report.status_condition}</span>
                    </div>
                </div>
            </div>
        `;

        // Store Full Object for Modal functionality
        card.reportData = report;

        return card;
    }

    // --------------------------------------------------------------------------
    // Bulk Selection Logic (Simplified - Always Active)
    // --------------------------------------------------------------------------
    const btnDeleteSelected = document.getElementById('btn-delete-selected');
    const selectedCountSpan = document.getElementById('selected-count');

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
            url: '/api/reports/bulk-delete',
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
        const card = document.querySelector(`.report-card[data-id="${reportId}"]`);
        if (!card || !card.reportData) return;
        const r = card.reportData;
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
            url: `/api/reports/${currentReportId}`,
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
