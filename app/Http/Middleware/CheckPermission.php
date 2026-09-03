<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request and check if authenticated user has the required permission.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $permission
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Non authentifié. Veuillez vous connecter.',
            ], 401);
        }

        if (! $user->hasPermission($permission)) {
            return response()->json([
                'message' => "Accès non autorisé : votre rôle [{$user->role}] ne dispose pas de la permission [{$permission}].",
                'required_permission' => $permission,
            ], 403);
        }

        return $next($request);
    }
}
