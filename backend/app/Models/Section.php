<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Section extends Model
{
    protected $fillable = [
        'name',
        'description',
        'access_price',
        'default_roles',
        'image',
        'parent_id',
        'position',
    ];

    protected $casts = [
        'access_price' => 'decimal:2',
        'position' => 'integer',
        'default_roles' => 'array',
        'default_roles_json' => 'json',
    ];

    protected $appends = ['image_url', 'default_roles_json'];


    public function getDefaultRolesJsonAttribute()
    {
        if (!is_array($this->default_roles)) {
            return [];
        }

        return Role::whereIn('id', $this->default_roles)
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'min_deposit' => $role->min_deposit,
                    'users_count' => $role->users_count,
                ];
            })
            ->toArray();
    }



    /**
     * Get the parent section
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'parent_id');
    }

    /**
     * Get all child sections
     */
    public function children(): HasMany
    {
        return $this->hasMany(Section::class, 'parent_id')->orderBy('position');
    }

    /**
     * Get all descendants recursively
     */
    public function descendants(): HasMany
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get all ancestors recursively
     */
    public function ancestors()
    {
        $ancestors = collect([]);
        $parent = $this->parent;

        while ($parent) {
            $ancestors->push($parent);
            $parent = $parent->parent;
        }

        return $ancestors;
    }

    /**
     * Check if this section is a parent of given section
     */
    public function isParentOf(Section $section): bool
    {
        return $this->children()->where('id', $section->id)->exists();
    }

    /**
     * Check if this section is a child of given section
     */
    public function isChildOf(Section $section): bool
    {
        return $this->parent_id === $section->id;
    }

    /**
     * Check if section is root level
     */
    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }

    /**
     * Get the depth level of this section
     */
    public function getDepth(): int
    {
        return $this->ancestors()->count();
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'section_user')
            ->withTimestamps();
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? asset('storage/' . $this->image) : null;
    }

    /**
     * Scope to get only root sections
     */
    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id')->orderBy('position');
    }

    /**
     * Boot method to handle cascading deletes
     */
    protected static function boot()
    {
        parent::boot();

        // When deleting a section, delete all its descendants
        static::deleting(function ($section) {
            // Delete all children recursively
            $section->children()->each(function ($child) {
                $child->delete();
            });
        });
    }


    /**
     * Build a nested tree structure from a flat list of sections
     */
    public static function buildTree($sections, $parentId = null)
    {
        $branch = [];

        foreach ($sections as $section) {
            if ($section->parent_id == $parentId) {
                $children = self::buildTree($sections, $section->id);

                $sectionArray = $section->toArray();
                if ($children) {
                    $sectionArray['children'] = $children;
                }

                $branch[] = $sectionArray;
            }
        }

        usort($branch, function ($a, $b) {
            return $a['position'] <=> $b['position'];
        });

        return $branch;
    }

}