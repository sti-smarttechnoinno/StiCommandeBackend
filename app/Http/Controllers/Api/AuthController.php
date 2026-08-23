<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $loginInput = $request->input('username')
            ?? $request->input('email')
            ?? $request->input('login');

        if (empty($loginInput)) {
            throw ValidationException::withMessages([
                'username' => ['The username or email field is required.'],
            ]);
        }

        $inputTrimmed = strtolower(trim($loginInput));

        // Find user by exact email, constructed username email, employee ID, or username handle prefix
        $user = User::where(function ($query) use ($loginInput, $inputTrimmed) {
            $query->where('email', $loginInput)
                ->orWhere('email', $inputTrimmed)
                ->orWhere('email', $inputTrimmed . '@eststar.dz')
                ->orWhere('employee_id', $loginInput)
                ->orWhere('name', $loginInput)
                ->orWhere('email', 'LIKE', $inputTrimmed . '@%');
        })->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided username/email or password is incorrect.'],
            ]);
        }

        if (isset($user->is_active) && ! $user->is_active) {
            throw ValidationException::withMessages([
                'username' => ['Your account has been deactivated.'],
            ]);
        }

        $user->update(['last_login_at' => now(), 'status' => 'online']);

        $token = $user->createToken('auth-token')->plainTextToken;
        $usernameHandle = explode('@', $user->email)[0] ?? $user->name;

        return response()->json([
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'username' => $usernameHandle,
                'email' => $user->email,
                'delegateCode' => $user->employee_id ?? ('DEL-2026-' . str_pad($user->id, 6, '0', STR_PAD_LEFT)),
                'role' => $user->role,
                'region' => $user->region ?? 'Algiers',
                'wilaya' => $user->wilaya ?? '16 - Alger',
                'phone' => $user->phone ?? '',
                'status' => $user->status ?? 'online',
                'is_active' => (bool) ($user->is_active ?? true),
                'avatar' => strtoupper(substr($user->name, 0, 1)),
            ],
            'token' => $token,
            'message' => 'Logged in successfully',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_active' => $user->is_active,
                'avatar' => strtoupper(substr($user->name, 0, 1)),
                'last_login_at' => $user->last_login_at?->toISOString(),
            ],
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
            'password' => ['sometimes', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => strtoupper(substr($user->name, 0, 1)),
            ],
            'message' => 'Profile updated successfully',
        ]);
    }
}
