<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Rooms - TrackAsset</title>
    <!-- Link to custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/inventories.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/users.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/rooms.css') }}?v={{ time() }}">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="{{ asset('js/dashboard.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/rooms.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/auth-guard.js') }}?v={{ time() }}"></script>
</head>

<body>

    <div class="app-container">

        <!-- Sidebar -->
        <aside id="sidebar" class="sidebar">

            <!-- Sidebar Header -->
            <div class="sidebar-header">
                <span class="brand-text">TrackAsset</span>
            </div>

            <!-- Menu Items -->
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
                <a href="{{ route('reports') }}" class="nav-link">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 00-2 2v12a2 2 0 002 2h5l-4 4 4-4H9a2 2 0 00-2-2">
                        </path>
                    </svg>
                    Reports
                </a>
                <a href="{{ route('rooms') }}" class="nav-link active">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                        </path>
                    </svg>
                    Rooms
                </a>
                @if(Auth::user()->role === 'admin')
                    <a href="{{ route('users') }}" class="nav-link">
                        <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">
                            </path>
                        </svg>
                        Users
                    </a>
                @endif
            </nav>
        </aside>

        <!-- Overlay for mobile sidebar -->
        <div id="sidebar-overlay" class="sidebar-overlay"></div>

        <!-- Main Content Wrapper -->
        <div class="main-wrapper">

            <!-- Navbar -->
            <header class="top-header">

                <!-- Left: Hamburger & Title -->
                <div class="header-left">
                    <button id="sidebar-toggle" class="sidebar-toggle">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <h2 class="page-title">Rooms</h2>
                </div>

                <!-- Right: User Profile -->
                <div class="header-right">
                    <div class="user-profile">
                        <img src="{{ asset(Auth::user()->profile_photo) }}" alt="Profile" class="profile-img">
                        <span class="user-name">{{ Auth::user()->firstname }}</span>
                    </div>

                    <!-- Cog Dropdown -->
                    <div style="position: relative;">
                        <button id="dropdown-btn" style="background:none; border:none; cursor:pointer; color:#4b5563;">
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
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

            <!-- Main Content Area -->
            <main class="content-area">
                <!-- Controls Bar -->
                <div class="controls-bar">
                    <div class="search-wrapper">
                        <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        <input type="text" placeholder="Search rooms..." class="search-input">
                    </div>
                    @if(Auth::user()->role === 'admin')
                        <div class="action-buttons">
                            <button id="btn-delete-selected" class="btn btn-danger" style="display: none;"
                                data-route="{{ route('rooms.bulk_delete') }}">
                                Delete Selected (<span id="selected-count">0</span>)
                            </button>
                            <a href="{{ route('rooms.create') }}" class="btn btn-primary" id="btn-add-room">
                                <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Add Room
                            </a>
                        </div>
                    @endif
                </div>

                <!-- Assigned Rooms Section -->
                <div id="assigned-rooms-section" style="display: none;">
                    <h3 style="margin-bottom: 1rem; color: #374151;">Assigned Rooms</h3>
                    <div class="inventory-grid" id="assigned-rooms-container" style="margin-bottom: 2rem;">
                        <!-- Populated by JS -->
                    </div>
                </div>

                <!-- Available Rooms Section (Visible to All) -->
                <h3 id="available-rooms-title" style="margin-bottom: 1rem; color: #374151;">
                    Available Rooms
                </h3>
                <div class="inventory-grid" id="available-rooms-container">
                    <!-- Populated by JS -->
                </div>
            </main>
        </div>
    </div>

</body>

</html>