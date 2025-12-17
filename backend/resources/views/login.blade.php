<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - TrackAsset</title>

    <!-- Tailwind CSS (Layout) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Custom CSS (Floating Labels) -->
    <link rel="stylesheet" href="{{ asset('css/logres.css') }}">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="{{ asset('js/login.js') }}?v={{ time() }}"></script>
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

        <!-- Flash Messages -->
        @if(session('success'))
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm">
                {{ session('success') }}
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

        <form action="{{ route('login') }}" method="POST" class="space-y-5">
            @csrf

            <!-- Username Field -->
            <div class="relative">
                <input type="text" id="username" name="username"
                    class="floating-input peer w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-transparent"
                    placeholder="Username">
                <label for="username"
                    class="absolute left-4 top-3 text-gray-500 text-sm transition-all duration-200 pointer-events-none">
                    Username
                </label>
            </div>

            <!-- Password Field -->
            <div class="relative">
                <input type="password" id="password" name="password"
                    class="floating-input peer w-full h-12 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-transparent"
                    placeholder="Password">
                <label for="password"
                    class="absolute left-4 top-3 text-gray-500 text-sm transition-all duration-200 pointer-events-none">
                    Password
                </label>
            </div>

            <!-- Log In Button -->
            <button type="submit"
                class="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md transition duration-200">
                Log In
            </button>

            <!-- Forgot Password -->
            <div class="text-center">
                <a href="{{ route('password.request') }}"
                    class="text-sm text-indigo-600 hover:text-indigo-800 hover:underline">
                    Forgot Password?
                </a>
            </div>

            <!-- Divider -->
            <div class="relative flex py-2 items-center">
                <div class="flex-grow border-t border-gray-300"></div>
                <span class="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
                <div class="flex-grow border-t border-gray-300"></div>
            </div>

            <!-- Create Account Button -->
            <a href="{{ route('register') }}"
                class="block w-full h-12 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-md decoration-0 transition duration-200">
                Create New Account
            </a>

        </form>
    </div>

</body>

</html>