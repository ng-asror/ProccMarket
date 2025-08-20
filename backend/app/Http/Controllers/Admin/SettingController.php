<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::all()->keyBy('key');

        return Inertia::render('admin/settings/index', [
            'settings' => $settings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:settings,key',
            'name' => 'required|string|max:255',
            'value' => 'nullable|string',
        ]);

        Setting::create($validated);

        return redirect()->route('admin.settings.index')->with('success', 'Setting created successfully');
    }

    public function update(Request $request, Setting $setting)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'value' => 'nullable|string',
        ]);

        $setting->update($validated);

        return redirect()->route('admin.settings.index')->with('success', 'Setting updated successfully');
    }

    public function destroy(Setting $setting)
    {
        // Prevent deleting default settings
        if (in_array($setting->key, ['site_title', 'logo', 'support_link'])) {
            return redirect()->route('admin.settings.index')->with('error', 'Cannot delete default setting');
        }

        $setting->delete();

        return redirect()->route('admin.settings.index')->with('success', 'Setting deleted successfully');
    }
}