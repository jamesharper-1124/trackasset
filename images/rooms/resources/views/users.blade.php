<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Users - TrackAsset</title>
    <!-- Link to custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/inventories.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/users.css') }}?v={{ time() }}">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="{{ asset('js/auth-guard.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/dashboard.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/users.js') }}?v={{ time() }}" defer></script>
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
                <a href="{{ route('rooms') }}" class="nav-link">
                    <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                        </path>
                    </svg>
                    Rooms
                </a>
                @if(Auth::user()->role === 'admin')
                    <a href="{{ route('users') }}" class="nav-link active">
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
                    <h2 class="page-title">Users</h2>
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

                <div class="controls-bar">
                    <div class="action-buttons">
                        <a href="{{ route('users.create') }}" class="btn btn-primary">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 4v16m8-8H4"></path>
                            </svg>
                            Add User
                        </a>
                        <button id="delete-toggle-btn" class="btn btn-danger">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                </path>
                            </svg>
                            Delete Multiple
                        </button>
                    </div>
                    <div class="search-wrapper">
                        <span class="search-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </span>
                        <input type="text" class="search-input" placeholder="Search users...">
                    </div>
                </div>

                <!-- Admin Section -->
                <div class="user-section">
                    <h3 class="section-title">Admin(s)</h3>
                    <div class="users-grid" id="admins-container">
                        @foreach($admins as $user)
                            <div class="user-card">
                                <input type="checkbox" class="user-checkbox" value="{{ $user->id }}"
                                    data-role="{{ $user->role }}" style="display: none;">
                                <div class="user-avatar">
                                    <img src="{{ asset($user->profile_photo) }}" alt="{{ $user->firstname }}">
                                </div>
                                <div class="user-info">
                                    <h3 class="user-name" title="{{ $user->firstname }} {{ $user->lastname }}">
                                        {{ Str::limit($user->firstname . ' ' . $user->lastname, 20) }}
                                    </h3>
                                    <p class="user-id" style="font-size: 0.8rem; color: #6b7280;">User ID: {{ $user->id }}
                                    </p>
                                    <p class="user-role">{{ ucfirst($user->role) }}</p>
                                </div>
                                <div class="user-actions">
                                    <a href="{{ route('users.edit', $user->id) }}" class="btn-icon btn-edit" title="Edit"
                                        style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            style="width: 100%; height: 100%;">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                                            </path>
                                        </svg>
                                    </a>
                                    @if($user->role === 'admin')
                                        <button type="button" class="btn-icon btn-disabled-delete" title="Delete"
                                            onclick="alert('You cannot delete an admin account.');">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                                </path>
                                            </svg>
                                        </button>
                                    @else
                                        <button type="button" class="btn-icon btn-delete" title="Delete"
                                            data-id="{{ $user->id }}">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                                </path>
                                            </svg>
                                        </button>
                                    @endif
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>

                <div class="user-section">
                    <h3 class="section-title">Staff(s)</h3>
                    <div class="users-grid" id="staffs-container">
                        @foreach($staffs as $user)
                            <div class="user-card">
                                <input type="checkbox" class="user-checkbox" value="{{ $user->id }}"
                                    data-role="{{ $user->role }}" style="display: none;">
                                <div class="user-avatar">
                                    <img src="{{ asset($user->profile_photo) }}" alt="{{ $user->firstname }}">
                                </div>
                                <div class="user-info">
                                    <h3 class="user-name" title="{{ $user->firstname }} {{ $user->lastname }}">
                                        {{ Str::limit($user->firstname . ' ' . $user->lastname, 20) }}
                                    </h3>
                                    <p class="user-id" style="font-size: 0.8rem; color: #6b7280;">User ID: {{ $user->id }}
                                    </p>
                                    <p class="user-role">{{ ucfirst($user->role) }}</p>
                                </div>
                                <div class="user-actions">
                                    <a href="{{ route('users.edit', $user->id) }}" class="btn-icon btn-edit" title="Edit"
                                        style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            style="width: 100%; height: 100%;">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                                            </path>
                                        </svg>
                                    </a>
                                    <button type="button" class="btn-icon btn-delete" title="Delete"
                                        data-id="{{ $user->id }}">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                            </path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>

                <!-- User Section -->
                <div class="user-section">
                    <h3 class="section-title">User(s)</h3>
                    <div class="users-grid" id="users-container">
                        @foreach($users as $user)
                            <div class="user-card">
                                <input type="checkbox" class="user-checkbox" value="{{ $user->id }}"
                                    data-role="{{ $user->role }}" style="display: none;">
                                <div class="user-avatar">
                                    <img src="{{ asset($user->profile_photo) }}" alt="{{ $user->firstname }}">
                                </div>
                                <div class="user-info">
                                    <h3 class="user-name" title="{{ $user->firstname }} {{ $user->lastname }}">
                                        {{ Str::limit($user->firstname . ' ' . $user->lastname, 20) }}
                                    </h3>
                                    <p class="user-id" style="font-size: 0.8rem; color: #6b7280;">User ID: {{ $user->id }}
                                    </p>
                                    <p class="user-role">{{ ucfirst($user->role) }}</p>
                                </div>
                                <div class="user-actions">
                                    <a href="{{ route('users.edit', $user->id) }}" class="btn-icon btn-edit" title="Edit"
                                        style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            style="width: 100%; height: 100%;">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z">
                                            </path>
                                        </svg>
                                    </a>
                                    <button type="button" class="btn-icon btn-delete" title="Delete"
                                        data-id="{{ $user->id }}">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                                            </path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </main>
        </div>
    </div>

</body>

</html>