<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Mail\SendCodeMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class ApiAuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'username' => 'required|string|unique:users|min:4',
            'password' => 'required|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $code = rand(100000, 999999);

        $user = User::create([
            'firstname' => $request->firstname,
            'lastname' => $request->lastname,
            'address' => $request->address ?? null,
            'phone' => $request->phone ?? null,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'verification_code' => $code,
            'verified' => 'NO',
        ]);

        try {
            Mail::to($user->email)->send(new SendCodeMail($code));
        } catch (\Exception $e) {
            // Log error or ignore
        }

        // Create token for immediate login (optional)
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Please check your email to complete your registration.',
            'user' => $user,
            'token' => $token
        ], 201);
    }

    public function verifyCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->verification_code !== $request->code) {
            return response()->json(['message' => 'The OTP is invalid. Please check your email again.'], 400);
        }

        $user->email_verified_at = now();
        $user->verification_code = null;
        $user->verified = 'YES';
        $user->save();

        return response()->json(['message' => 'Account has been verified successfully. You can now log in to your account.']);
    }

    public function login(Request $request)
    {
        if (!Auth::attempt($request->only('username', 'password'))) {
            return response()->json(['message' => 'Invalid login details'], 401);
        }

        $user = User::where('username', $request->username)->firstOrFail();

        if ($user->verified === 'NO') {
            return response()->json(['message' => 'Please verify your email first.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
            'token' => $token,
        ]);
    }
}
