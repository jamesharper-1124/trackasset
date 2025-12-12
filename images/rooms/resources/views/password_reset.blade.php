<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - TrackAsset</title>

    <!-- Tailwind CSS (Layout) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Custom CSS (Floating Labels) -->
    <link rel="stylesheet" href="{{ asset('css/logres.css') }}">
    <script src="{{ asset('js/guest-guard.js') }}?v={{ time() }}"></script>
    <style>
        /* Fallback for floating labels if css file is missing */
        .floating-input:placeholder-shown~label {
            top: 0.75rem;
            font-size: 0.875rem;
            color: #6b7280;
        }

        .floating-input:focus~label,
        .floating-input:not(:placeholder-shown)~label {
            top: -0.5rem;
            left: 0.75rem;
            font-size: 0.75rem;
            color: #4f46e5;
            background-color: white;
            padding: 0 0.25rem;
        }
    </style>
</head>

<body class="bg-gray-100 flex items-center justify-center min-h-screen">

    <div class="w-full max-w-sm bg-white p-8 rounded-lg shadow-md border border-gray-200">

        <!-- Logo -->
        <div class="flex justify-center mb-6">
            <img src="{{ asset('images/inventory/default.png') }}" alt="App Logo"
                class="h-20 w-20 rounded-full object-cover border-2 border-indigo-500">
        </div>

        <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Reset Password</h2>

        @if($errors->any())
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('password.update') }}" method="POST" class="space-y-5">
            @csrf

            <input type="hidden" name="token" value="{{ $token }}">

            <!-- Email Field (Readonly or Hidden) -->
            <div class="relative">
                <input type="email" id="email" name="email" value="{{ $email ?? old('email') }}" readonly
                    class="floating-input peer w-full h-12 px-4 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed focus:outline-none"
                    placeholder="Email Address">
                <label for="email"
                    class="absolute left-4 top-3 text-gray-500 text-sm transition-all duration-200 pointer-events-none">
                    Email Address
                </label>
            </div>

            <!-- New Password Field -->
            <div class="relative">
                <input type="password" id="password" name="password"
                    class="floating-input peer w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-transparent"
                    placeholder="New Password" required>
                <label for="password"
                    class="absolute left-4 top-3 text-gray-500 text-sm transition-all duration-200 pointer-events-none">
                    New Password
                </label>
            </div>

            <!-- Confirm Password Field -->
            <div class="relative">
                <input type="password" id="password_confirmation" name="password_confirmation"
                    class="floating-input peer w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-transparent"
                    placeholder="Confirm Password" required>
                <label for="password_confirmation"
                    class="absolute left-4 top-3 text-gray-500 text-sm transition-all duration-200 pointer-events-none">
                    Confirm Password
                </label>
            </div>

            <!-- Submit Button -->
            <button type="submit"
                class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition duration-200">
                Reset Password
            </button>

        </form>
    </div>

</body>

</html>