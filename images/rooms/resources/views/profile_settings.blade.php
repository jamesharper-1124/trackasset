<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile Settings - TrackAsset</title>
    <!-- Link to custom CSS -->
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ time() }}">
    <link rel="stylesheet" href="{{ asset('css/add_users.css') }}?v={{ time() }}">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="{{ asset('js/dashboard.js') }}?v={{ time() }}"></script>
    <script src="{{ asset('js/profile_settings.js') }}?v={{ time() }}" defer></script>
    <script src="{{ asset('js/auth-guard.js') }}?v={{ time() }}"></script>
</head>

<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside id="sidebar" class="sidebar">
            <div class="sidebar-header">
                <span class="brand-text">TRACKASSET</span>
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

        <div id="sidebar-overlay" class="sidebar-overlay"></div>

        <div class="main-wrapper">
            <header class="top-header">
                <div class="header-left">
                    <button id="sidebar-toggle" class="sidebar-toggle">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16">
                            </path>
                        </svg>
                    </button>
                    <h2 class="page-title">Profile Settings</h2>
                </div>
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

            <main class="content-area">
                <div class="form-container">
                    <h3 class="form-title">Profile Settings</h3>

                    <form action="{{ route('settings.update') }}" method="POST" enctype="multipart/form-data">
                        @csrf
                        @method('PUT')
                        @if ($errors->any())
                            <div
                                style="background-color: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                                <ul style="list-style: disc; padding-left: 1.5rem; margin: 0;">
                                    @foreach ($errors->all() as $error)
                                        <li>{{ $error }}</li>
                                    @endforeach
                                </ul>
                            </div>
                        @endif
                        @if(session('success'))
                            <div
                                style="background-color: #d1fae5; color: #065f46; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                                {{ session('success') }}
                            </div>
                        @endif

                        <div class="form-grid">

                            <!-- Left Column: Photo & Auth -->
                            <div class="form-group" style="display: flex; flex-direction: column; align-items: center;">
                                <div id="profile-image-wrapper" class="image-upload-wrapper" style="cursor: pointer;">
                                    <img src="{{ asset($user->profile_photo ? $user->profile_photo : 'images/profile_pic/default.png') }}"
                                        alt="Preview" class="image-preview" id="preview-img">
                                    <div class="upload-placeholder">
                                        <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z">
                                            </path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        </svg>
                                        <span class="upload-text">Change Image</span>
                                    </div>
                                    <input type="file" name="profile_photo" id="profile_photo_input"
                                        class="file-input-hidden" style="display: none;">
                                </div>

                                <div style="margin-top: 2rem; width: 100%;">
                                    <label class="form-label">Username</label>
                                    <input type="text" name="username" class="form-input"
                                        value="{{ old('username', $user->username) }}" required>
                                </div>
                                <div style="margin-top: 1rem; width: 100%;">
                                    <label class="form-label">Password</label>
                                    <input type="password" name="password" class="form-input"
                                        placeholder="Leave blank to keep current password">
                                </div>
                            </div>

                            <!-- Right Column: Personal Info -->
                            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                                <div>
                                    <label class="form-label">First Name</label>
                                    <input type="text" name="firstname" class="form-input"
                                        value="{{ old('firstname', $user->firstname) }}" required>
                                </div>

                                <div>
                                    <label class="form-label">Last Name</label>
                                    <input type="text" name="lastname" class="form-input"
                                        value="{{ old('lastname', $user->lastname) }}" required>
                                </div>

                                <div>
                                    <label class="form-label">Address</label>
                                    <input type="text" name="address" class="form-input"
                                        value="{{ old('address', $user->address) }}">
                                </div>

                                <div>
                                    <label class="form-label">Phone Number</label>
                                    <input type="text" name="phone" class="form-input"
                                        value="{{ old('phone', $user->phone) }}">
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div>
                                        <label class="form-label">Email</label>
                                        <input type="email" name="email" class="form-input"
                                            value="{{ old('email', $user->email) }}" required>
                                    </div>
                                    <div>
                                        <label class="form-label">Role</label>
                                        <input type="text" class="form-input" value="{{ ucfirst($user->role) }}"
                                            readonly
                                            style="background-color: #f3f4f6; color: #6b7280; cursor: not-allowed;">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <a href="{{ route('dashboard') }}" class="btn-cancel">Back to Dashboard</a>
                            <button type="submit" class="btn-submit">Save Changes</button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    </div>

    <script>
        // Profile Image Preview Script (Robust with Unique IDs)
        const profileInput = document.getElementById('profile_photo_input');
        const profileWrapper = document.getElementById('profile-image-wrapper');
        const profilePreview = document.getElementById('preview-img');

        if (profileWrapper && profileInput) {
            // Prevent recursive clicks
            profileWrapper.addEventListener('click', (e) => {
                if (e.target !== profileInput) {
                    profileInput.click();
                }
            });

            profileInput.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop bubbling
            });

            profileInput.addEventListener('change', function () {
                const file = this.files[0];
                if (file) {
                    // Size validation (10MB raw limit before compression)
                    if (file.size > 10 * 1024 * 1024) {
                        alert('File too large (Max 10MB)');
                        this.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const img = new Image();
                        img.onload = function () {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');

                            // Max dimensions
                            const MAX_WIDTH = 800;
                            const MAX_HEIGHT = 800;
                            let width = img.width;
                            let height = img.height;

                            // Calculate new dimensions
                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }

                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);

                            // Compress to JPEG 0.7 quality
                            canvas.toBlob(function (blob) {
                                // Store the compressed blob on the input element for the AJAX script to find
                                profileInput.processedBlob = blob;

                                // Update preview
                                profilePreview.src = URL.createObjectURL(blob);
                            }, 'image/jpeg', 0.7);
                        };
                        img.src = e.target.result;
                    }
                    reader.onerror = function () {
                        alert('Error reading file');
                    }
                    reader.readAsDataURL(file);
                }
            });
        }
    </script>
</body>

</html>