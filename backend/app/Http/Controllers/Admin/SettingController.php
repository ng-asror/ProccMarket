<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

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
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        $data = [
            'key' => $validated['key'],
            'name' => $validated['name'],
        ];

        if ($request->hasFile('file') && ($request->input('key') && (str_contains($request->input('key'), '_img') || str_contains($request->input('key'), '_file')))) {
            $path = $request->file('file')->store('settings', 'public');
            $data['value'] = Storage::url($path);
        } else {
            $data['value'] = $validated['value'];
        }

        Setting::create($data);

        return redirect()->route('admin.settings.index')->with('success', 'Setting created successfully');
    }

    public function update(Request $request, Setting $setting)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'value' => 'nullable|string',
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        $data = [
            'name' => $validated['name'],
        ];

        if ($request->hasFile('file') && (str_contains($setting->key, '_img') || str_contains($setting->key, '_file'))) {
            // Delete old file if exists
            if ($setting->value) {
                $oldPath = str_replace(Storage::url(''), '', $setting->value);
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('file')->store('settings', 'public');
            $data['value'] = Storage::url($path);
        } else {
            $data['value'] = $validated['value'];
        }

        $setting->update($data);

        return redirect()->route('admin.settings.index')->with('success', 'Setting updated successfully');
    }

    public function destroy(Setting $setting)
    {
        // Prevent deleting default settings
        if (in_array($setting->key, ['site_title', 'logo', 'support_link'])) {
            return redirect()->route('admin.settings.index')->with('error', 'Cannot delete default setting');
        }

        // Delete associated file if exists
        if ($setting->value && (str_contains($setting->key, '_img') || str_contains($setting->key, '_file'))) {
            $path = str_replace(Storage::url(''), '', $setting->value);
            Storage::disk('public')->delete($path);
        }

        $setting->delete();

        return redirect()->route('admin.settings.index')->with('success', 'Setting deleted successfully');
    }
}