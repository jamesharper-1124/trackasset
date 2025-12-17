<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function settings()
    {
        $user = Auth::user();
        return view('profile_settings', compact('user'));
    }

    public function updateSettings(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();
        \Illuminate\Support\Facades\Log::info('Settings Update Attempt', ['user_id' => $user->id, 'role' => $user->role]);

        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'username' => 'required|string|min:4|unique:users,username,' . $user->id,
            'password' => 'nullable|min:6',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user->firstname = $request->firstname;
        $user->lastname = $request->lastname;
        $user->email = $request->email;
        $user->username = $request->username;
        $user->address = $request->address;
        $user->phone = $request->phone;

        if ($request->filled('password')) {
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        if ($request->hasFile('profile_photo')) {
            $file = $request->file('profile_photo');
            $safe_username = \Illuminate\Support\Str::slug($request->username);
            $filename = $safe_username . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('images/profile_pic'), $filename);
            $user->profile_photo = 'images/profile_pic/' . $filename;
        }

        $user->save();

        return response()->json(['message' => 'Profile updated successfully', 'redirect' => route('settings')]);
    }

    public function index()
    {
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }

        $admins = User::where('role', 'admin')->get();
        $staffs = User::where('role', 'staff')->get();
        $users = User::where('role', 'user')->get();

        return view('users', compact('admins', 'staffs', 'users'));
    }

    public function getData(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        $user = auth()->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $admins = User::where('role', 'admin')->get();
        $staffs = User::where('role', 'staff')->get();
        $users = User::where('role', 'user')->get();

        return response()->json([
            'admins' => $admins,
            'staffs' => $staffs,
            'users' => $users,
            'currentUser' => [
                'id' => $user->id,
                'role' => $user->role
            ]
        ]);
    }

    public function create()
    {
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('dashboard');
        }
        return view('add_users');
    }

    public function store(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'username' => 'required|string|unique:users|min:4',
            'password' => 'required|min:6',
            'role' => 'required|in:admin,staff,user',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $code = rand(100000, 999999);
        $profile_photo_path = 'images/profile_pic/default.png';

        if ($request->hasFile('profile_photo')) {
            $file = $request->file('profile_photo');
            $safe_username = \Illuminate\Support\Str::slug($request->username);
            $filename = $safe_username . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('images/profile_pic'), $filename);
            $profile_photo_path = 'images/profile_pic/' . $filename;
        }

        User::create([
            'firstname' => $request->firstname,
            'lastname' => $request->lastname,
            'email' => $request->email,
            'username' => $request->username,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => $request->role,
            'address' => $request->address,
            'phone' => $request->phone,
            'verification_code' => $code,
            'verified' => 'NO',
            'profile_photo' => $profile_photo_path,
        ]);

        return response()->json(['message' => 'User created successfully', 'redirect' => route('users')]);
    }

    public function edit($id)
    {
        if (Auth::user()->role !== 'admin') {
            return redirect()->route('dashboard');
        }

        $user = User::findOrFail($id);
        return view('edit_users', compact('user'));
    }

    public function update(Request $request, $id)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'username' => 'required|string|min:4|unique:users,username,' . $user->id,
            'password' => 'nullable|min:6',
            'role' => 'required|in:admin,staff,user',
            'address' => 'nullable|string',
            'phone' => 'nullable|string',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user->firstname = $request->firstname;
        $user->lastname = $request->lastname;
        $user->email = $request->email;
        $user->username = $request->username;
        $user->role = $request->role;
        $user->address = $request->address;
        $user->phone = $request->phone;

        if ($request->filled('password')) {
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
        }

        if ($request->hasFile('profile_photo')) {
            $file = $request->file('profile_photo');
            $safe_username = \Illuminate\Support\Str::slug($request->username);
            $filename = $safe_username . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('images/profile_pic'), $filename);
            $user->profile_photo = 'images/profile_pic/' . $filename;
        }

        $user->save();

        return response()->json(['message' => 'User updated successfully', 'redirect' => route('users')]);
    }

    public function bulkDelete(Request $request)
    {
        if (!$request->bearerToken()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        if (Auth::user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $ids = $request->input('ids');

        if (empty($ids) || !is_array($ids)) {
            return response()->json(['success' => false, 'message' => 'No users selected'], 400);
        }

        // Prevent deleting yourself
        if (in_array(Auth::id(), $ids)) {
            return response()->json(['success' => false, 'message' => 'You cannot delete yourself'], 400);
        }

        // Prevent deleting admins
        $adminCount = User::whereIn('id', $ids)->where('role', 'admin')->count();
        if ($adminCount > 0) {
            return response()->json(['success' => false, 'message' => 'You cannot delete an admin account'], 400);
        }

        User::whereIn('id', $ids)->delete();

        return response()->json(['success' => true, 'message' => 'Users deleted successfully']);
    }

    public function destroy(Request $request, $id)
    {
        if (!$request->bearerToken()) {
            return response()->json(['message' => 'Unauthenticated: Bearer Token Missing'], 401);
        }

        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        if ($user->id === Auth::id()) {
            return response()->json(['message' => 'You cannot delete yourself'], 400);
        }

        if ($user->role === 'admin') {
            return response()->json(['message' => 'You cannot delete an admin account'], 400);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully', 'redirect' => route('users')]);
    }
}
