<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Admin
{
    public function handle(Request $request, Closure $next)
    {
        if (!auth()->user()->is_admin) { // is_admin maydoni User modelida bo'lishi kerak
            abort(403, 'Unauthorized');
        }
        return $next($request);
    }
}