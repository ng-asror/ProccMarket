import * as React from 'react';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Role } from '@/types/section-types';

type RoleMultiSelectProps = {
  value: number[];
  onChange: (value: number[]) => void;
  roles: Role[];
};

export function RoleMultiSelect({
  value,
  onChange,
  roles,
}: RoleMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const toggleRole = (roleId: number) => {
    const numValue = value.map(Number);
    if (numValue.includes(roleId)) {
      onChange(numValue.filter((v) => v !== roleId));
    } else {
      onChange([...numValue, roleId]);
    }
  };

  const selectedRoles = roles.filter((role) =>
    value.map(Number).includes(role.id)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedRoles.length === 0
              ? 'Select roles...'
              : `${selectedRoles.length} role${selectedRoles.length > 1 ? 's' : ''} selected`}
          </span>
          <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto p-2">
          {roles.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No roles available
            </div>
          ) : (
            roles.map((role) => {
              const isSelected = value.map(Number).includes(role.id);
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent',
                    isSelected && 'bg-accent'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50'
                    )}
                  >
                    {isSelected && <IconCheck className="h-3 w-3" />}
                  </div>
                  <span className="flex-1 text-left">{role.name}</span>
                  {role.users_count !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {role.users_count} users
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}