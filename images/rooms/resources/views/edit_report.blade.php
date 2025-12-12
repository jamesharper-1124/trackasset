<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Report - TrackAsset</title>
    <!-- Link to custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/inventories.css') }}?v={{ time() }}">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="{{ asset('js/auth-guard.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/dashboard.js') }}?v={{ time() }}"></script>
    <style>
        /* Specific styles for Add/Edit Report */
        .item-preview-container {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background-color: #f9fafb;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
        }

        .item-preview-img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 0.375rem;
            background-color: #e5e7eb;
        }

        .item-preview-details h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 0.25rem 0;
        }

        .item-preview-details p {
            font-size: 0.875rem;
            color: #6b7280;
            margin: 0;
        }
    </style>
</head>

<body>

    <div class="app-container">

        <!-- Sidebar -->
        <aside id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <span class="brand-text">TrackAsset</span>
            </div>
            <nav class="sidebar-nav">
                <a href="{{ route('dashboard') }}" class="nav-link">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z">
                        </path>
                    </svg>
                    Dashboard
                </a>
                <a href="{{ route('inventories') }}" class="nav-link">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01">
                        </path>
                    </svg>
                    Inventories
                </a>
                <a href="{{ route('reports') }}" class="nav-link active">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 00-2 2v12a2 2 0 002 2h5l-4 4 4-4H9a2 2 0 00-2-2">
                        </path>
                    </svg>
                    Reports
                </a>
            </nav>
        </aside>
        <div id="sidebar-overlay" class="sidebar-overlay"></div>

        <div class="main-wrapper">
            <header class="top-header">
                <div class="header-left">
                    <button id="sidebar-toggle" class="sidebar-toggle">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <h2 class="page-title">Edit Report</h2>
                </div>
                <!-- Right: User Profile -->
                <div class="header-right">
                    <div class="user-profile">
                        <img src="{{ asset(Auth::user()->profile_photo) }}" alt="Profile" class="profile-img">
                        <span class="user-name">{{ Auth::user()->firstname }}</span>
                    </div>

                    <!-- Settings Dropdown -->
                    <div style="position: relative;">
                        <button id="dropdown-toggle"
                            style="background:none; border:none; cursor:pointer; padding:0.5rem; border-radius:50%;">
                            <svg class="text-muted" width="24" height="24" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" color="#6b7280"
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
                                </path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </button>
                        <!-- Dropdown Menu -->
                        <div id="dropdown-menu"
                            style="display:none; position:absolute; right:0; margin-top:0.5rem; width:12rem; background:white; border-radius:0.375rem; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); padding:0.25rem 0; z-index:50;">
                            <a href="{{ route('settings') }}"
                                style="display:block; padding:0.5rem 1rem; font-size:0.875rem; color:#374151; text-decoration:none;">Settings</a>
                            <form action="{{ route('logout') }}" method="POST">
                                @csrf
                                <button id="logout-btn" type="submit"
                                    style="display:block; width:100%; text-align:left; padding:0.5rem 1rem; font-size:0.875rem; color:#dc2626; background:none; border:none; cursor:pointer;">Logout</button>
                            </form>
                        </div>
                    </div>
                </div>
            </header>

            <main class="content-area">
                <div class="form-container">
                    <h3 class="form-title">Edit Report #{{ $report->id }}</h3>

                    @if ($errors->any())
                        <div
                            style="background-color: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                            <ul style="margin: 0; padding-left: 1.5rem;">
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <!-- IMPORTANT: Using reports.js logic for submission or standard POST? -->
                    <!-- Since Controller returns JSON redirect, we should probably stick to AJAX or standard form submission that handles JSON response? -->
                    <!-- But reports.js seems to be designed for the main page. -->
                    <!-- Let's make this a standard form submission or simple inline script. -->
                    <!-- Actually the controller method 'update' returns JSON. We should use JS to submit this form. -->

                    <form id="edit-report-form" data-id="{{ $report->id }}">

                        <div class="form-grid">

                            <!-- Read Only Inventory Info -->
                            <div style="grid-column: 1 / -1;">
                                <label class="form-label">Inventory Name (Read Only)</label>
                                <input type="text" class="form-input"
                                    value="{{ $report->inventory ? $report->inventory->inventory_name : 'Deleted Inventory' }}"
                                    disabled style="background-color: #f3f4f6;">
                            </div>

                            <!-- Selected Item Preview (Static) -->
                            <div class="item-preview-container" style="grid-column: 1 / -1; align-items: flex-start;">
                                @if($report->inventory && $report->inventory->inventory_photo)
                                    <img src="{{ asset($report->inventory->inventory_photo) }}" alt="Inventory"
                                        class="item-preview-img">
                                @else
                                    <div class="item-preview-img"
                                        style="display:flex; align-items:center; justify-content:center; font-size:0.7rem;">
                                        No Image</div>
                                @endif
                                <div class="item-preview-details">
                                    <h4>{{ $report->inventory ? $report->inventory->inventory_name : 'Deleted' }}</h4>
                                    <p>Room:
                                        {{ ($report->inventory && $report->inventory->room) ? $report->inventory->room->room_name : 'Unassigned' }}
                                    </p>
                                    <span class="card-status status-good"
                                        style="margin-top: 0.5rem; display:inline-block;">{{ $report->status_condition }}</span>
                                </div>
                            </div>

                            <!-- Reason / Remarks -->
                            <div style="grid-column: 1 / -1;">
                                <label class="form-label">Reported Issue</label>
                                <textarea name="remarks" class="form-input" rows="4"
                                    required>{{ $report->remarks }}</textarea>
                            </div>

                            <!-- Evidence Photo -->
                            <div style="grid-column: 1 / -1;">
                                <label class="form-label">Update Evidence (Optional)</label>
                                <button type="button" class="btn btn-white"
                                    onclick="document.getElementById('evidence-upload').click()">
                                    Upload New Photo
                                </button>
                                <input type="file" name="evidence_photo" id="evidence-upload" class="file-input-hidden"
                                    accept="image/*">

                                <!-- Current Photo -->
                                @if($report->evidence_photo)
                                    <div style="margin-top: 1rem;">
                                        <p style="font-size:0.875rem; color:#4b5563; margin-bottom:0.5rem;">Current
                                            Evidence:</p>
                                        <img src="{{ asset($report->evidence_photo) }}" alt="Current Evidence"
                                            style="max-width: 200px; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
                                    </div>
                                @endif

                                <!-- Evidence Preview -->
                                <div id="evidence-preview-container" style="display:none; margin-top: 1rem;">
                                    <p style="font-size:0.875rem; color:#4b5563; margin-bottom:0.5rem;">New Preview:</p>
                                    <img id="evidence-preview" src="" alt="Evidence Preview"
                                        style="max-width: 200px; border-radius: 0.5rem; border: 1px solid #e5e7eb;">
                                </div>
                            </div>

                        </div>

                        <div class="form-actions">
                            <a href="{{ route('reports') }}" class="btn-cancel">Cancel</a>
                            <button type="submit" class="btn-submit">Update Report</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    </div>

    <script>
        $(document).ready(function () {
            // Preview Logic
            $('#evidence-upload').on('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        $('#evidence-preview').attr('src', e.target.result);
                        $('#evidence-preview-container').show();
                    }
                    reader.readAsDataURL(file);
                }
            });

            // Submit Logic
            $('#edit-report-form').on('submit', function (e) {
                e.preventDefault();
                const id = $(this).data('id');
                const formData = new FormData(this);
                // Laravel PUT method spoofing
                formData.append('_method', 'PUT');

                const token = localStorage.getItem('auth_token');

                $.ajax({
                    url: `/api/reports/${id}`, // Matches Route::put('/reports/{report}') in web.php
                    method: 'POST', // POST for FormData with file
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        alert(response.message || 'Report updated!');
                        if (response.redirect) {
                            window.location.href = response.redirect;
                        } else {
                            window.location.href = '/reports';
                        }
                    },
                    error: function (xhr) {
                        alert('Error: ' + (xhr.responseJSON?.message || 'Update failed'));
                    }
                });
            });
        });
    </script>
</body>

</html>