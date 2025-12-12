<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - TrackAsset</title>

    <!-- Tailwind CSS (Layout) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Custom CSS (Floating Labels) -->
    <link rel="stylesheet" href="{{ asset('css/logres.css') }}">
    <script src="{{ asset('js/guest-guard.js') }}?v={{ time() }}"></script>
    <!-- Reusing login.js might be overkill if it specific to login form, but we can verify later. Inline script for now if needed. -->
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

        <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Forgot Password</h2>

        <p class="text-sm text-center text-gray-600 mb-6">
            Enter the email associated with your account and we'll send you a link to reset your password.
        </p>

        <!-- Flash Messages -->
        @if(session('status'))
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                {{ session('status') }}
            </div>
        @endif

        @if($errors->any())
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                <ul>
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('password.email') }}" method="POST" class="space-y-5">
            @csrf

            <!-- Email Field -->
            <div class="relative">
                <input type="email" id="email" name="email"
                    class="floating-input peer w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-transparent"
                    placeholder="Email Address" required>
                <label for="email"
                    class="absolute left-4 top-3 text-gray-500 text-sm transition-all duration-200 pointer-events-none">
                    Email Address
                </label>
            </div>

            <!-- Submit Button -->
            <button type="submit"
                class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition duration-200">
                Send Password Reset Link
            </button>

            <!-- Back to Login -->
            <div class="text-center mt-4">
                <a href="{{ route('login') }}" class="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                    Back to Login
                </a>
            </div>

        </form>
    </div>

</body>

</html>