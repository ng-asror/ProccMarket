<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'value',
    ];

    public $timestamps = true;

    public static function get($key, $default = null)
    {
        return static::where('key', $key)->value('value') ?? $default;
    }

    public static function set($key, $value)
    {
        return static::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    public static function incrementValue($key, $value = 1)
    {
        return static::where('key', $key)->increment('value', $value);
    }

    public static function decrementValue($key, $value = 1)
    {
        return static::where('key', $key)->decrement('value', $value);
    }
}